import { ref } from 'vue';
import Papa  from 'papaparse';
import {
  type StandardizedData,
  type ParsedResults,
} from '../../types/app-types';
import { useDBstore } from '@/stores/db';
import { useIndexedDB } from './useIndexDB';

const { storeInIndexedDB, deleteObjectStore } =
  useIndexedDB();

const DBstore = useDBstore();


export default function useCSVProcessing() {
  const file = ref<File | null>(null);
  const startLine = ref<number>(1); // Adjust default start line if needed
  const columnRoles = ref<string[]>([]); // Ensure columnRoles is properly defined
  const DBname = ref<string>('')
  const componentName = ref<string>('')
	const previewData = ref<string[][]>([]);
	const columns = ref<string[]>([]);
	const showModal = ref<boolean>(false);
	

  async function parseCSVForFullProcessing(): Promise<void> {
    if (file.value) {
			Papa.parse(file.value, {
				header: false,
				fastMode: true,
				skipEmptyLines: true,
				delimiter: ',', // Specify the delimiter (default is auto-detect)
				quoteChar: '"', // Specify the quote character
				escapeChar: '\\', // Specify the escape character (optional)
				complete(results: Papa.ParseResult<string[]>) {
					const dataStartIndex = startLine.value - 1;
					const fullData = results.data.slice(dataStartIndex);
					const standardizedData: StandardizedData[] = [];

					fullData.forEach((row: string[]) => {
						const standardizedRow: StandardizedData = {
							destName: '',
							dialCode: 0,
							rate: 0,
						};

						// Assuming columnRoles is correctly defined
						columnRoles.value.forEach((role, index) => {
							if (role) {
								// Adjust index to skip empty roles
								const columnIndex = columnRoles.value.indexOf(role);

								switch (role) {
									case 'destName':
										standardizedRow.destName = row[columnIndex];
										break;
									case 'dialCode':
										standardizedRow.dialCode = parseFloat(
											row[columnIndex]
										);
										break;
									case 'rate':
										standardizedRow.rate = parseFloat(
											row[columnIndex]
										);
										break;
									default:
										standardizedRow[role] = row[columnIndex];
								}
							}
						});

						standardizedData.push(standardizedRow);
					}); 

					storeDataInIndexedDB(standardizedData);
				},
			});
		}
  }


	function parseCSVForPreview(uploadedFile: File) {
		try {
			Papa.parse(uploadedFile, {
				header: false,
				complete(results) {
					previewData.value = results.data.slice(0, 25) as string[][];
					columns.value = results.data[
						startLine.value - 1
					] as string[];
					columnRoles.value = Array(columns.value.length).fill('');
					showModal.value = true;
				},
			});
		} catch {
			console.log('error uploading file');
		}
	}

  async function storeDataInIndexedDB(data: StandardizedData[]) {
    console.log('storing with ', DBname.value, componentName.value)
		try {
			if (file.value) {
				await storeInIndexedDB(
					data,
					DBname.value,
					file.value.name,
					componentName.value
				);
			}
		} catch (error) {
			console.error('Error storing data in IndexedDB:', error);
		}
	}

  // function preprocessCSV(csvText: string): string {
  //   const lines = csvText.split('\n');
  //   const processedLines = lines.map((line) => {
  //     const columns = line.split(',');
  //     const quotedColumns = columns.map((col) => `"${col}"`);
  //     return quotedColumns.join(',');
  //   });

  //   return processedLines.join('\n');
  // }

		async function removeFromDB() {
		let storeName = DBstore.getStoreNameByComponent(
			componentName.value
		);
		// resetLocalState();
		await deleteObjectStore(DBname.value, storeName);
	}

  return {
    file,
    startLine,
		previewData,
		columns,
    DBname,
		showModal,
    componentName,
    columnRoles,
		parseCSVForPreview,
    parseCSVForFullProcessing,
		removeFromDB
  };
}
