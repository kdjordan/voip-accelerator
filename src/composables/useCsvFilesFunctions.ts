import { ref } from 'vue';
import Papa from 'papaparse';
import {
	type StandardizedData,
	type ParsedResults,
} from '../../types/app-types';
import { useDBstate } from '@/stores/dbStore';
import useIndexedDB from './useIndexDB';

const { storeInIndexedDB, deleteObjectStore } =
	useIndexedDB();

const DBstore = useDBstate();


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
		if (!file.value) {
			console.error('No file selected');
			return;
		}
		console.log('These file names exist :', DBstore.filesUploaded);
		const fileNameExists = DBstore.checkFileNameAvailable(file.value.name);
		console.log('File name exists:', fileNameExists);

		if (!fileNameExists) {
			DBstore.setComponentFileIsUploading(componentName.value);
			console.log('Uploading ', file.value);

			try {
				Papa.parse(file.value, {
					header: false,
					skipEmptyLines: true,
					complete(results: Papa.ParseResult<string[]>) {
						const dataStartIndex = startLine.value - 1;
						const fullData = results.data.slice(dataStartIndex);
						const standardizedData: StandardizedData[] = [];

						fullData.forEach((row: string[]) => {
							console.log('hanging here')
							const standardizedRow: StandardizedData = {
								destName: '',
								dialCode: 0,
								rate: 0,
							};

							columnRoles.value.forEach((role, index) => {
								if (role) {
									switch (role) {
										case 'destName':
											standardizedRow.destName = row[index];
											break;
										case 'dialCode':
											standardizedRow.dialCode = parseFloat(row[index]);
											break;
										case 'rate':
											standardizedRow.rate = parseFloat(row[index]);
											break;
										default:
											standardizedRow[role] = row[index];
									}
								}
							});
							// Validate destName is a string
							const isValidDestName = typeof standardizedRow.destName === 'string' && standardizedRow.destName.length > 0;

							// Validate dialCode can be cast into a number
							const isValidDialCode = !isNaN(Number(standardizedRow.dialCode));

							// Validate rate can be parsed into a number
							const isValidRate = !isNaN(parseFloat(standardizedRow.rate.toString()));

							if (isValidDestName && isValidDialCode && isValidRate) {
								standardizedData.push(standardizedRow);
							}
						});

						storeDataInIndexedDB(standardizedData);
					},
				});
			} catch (e) {
				console.error('Error during CSV parsing', e);
			}
		} else {
			console.log('File with this name already exists.');
		}
	}

	// async function parseCSVForFullProcessing(): Promise<void> {
	// 	DBstore.setComponentFileIsUploading(componentName.value)
	// 	//check if file.name exists
	// 	//DBstore checkFileNameAvailable(file.name)

	// 	console.log('uploading ', file.value)
	// 	if (file.value) {
	// 		try {
	// 			Papa.parse(file.value, {
	// 				header: false,
	// 				skipEmptyLines: true,
	// 				complete(results: Papa.ParseResult<string[]>) {
	// 					const dataStartIndex = startLine.value - 1;
	// 					const fullData = results.data.slice(dataStartIndex);
	// 					const standardizedData: StandardizedData[] = [];

	// 					fullData.forEach((row: string[]) => {
	// 						const standardizedRow: StandardizedData = {
	// 							destName: '',
	// 							dialCode: 0,
	// 							rate: 0,
	// 						};

	// 						// Assuming columnRoles is correctly defined
	// 						columnRoles.value.forEach((role, index) => {
	// 							if (role) {
	// 								// Adjust index to skip empty roles
	// 								const columnIndex = columnRoles.value.indexOf(role);

	// 								switch (role) {
	// 									case 'destName':
	// 										standardizedRow.destName = row[columnIndex];
	// 										break;
	// 									case 'dialCode':
	// 										standardizedRow.dialCode = parseFloat(
	// 											row[columnIndex]
	// 										);
	// 										break;
	// 									case 'rate':
	// 										standardizedRow.rate = parseFloat(
	// 											row[columnIndex]
	// 										);
	// 										break;
	// 									default:
	// 										standardizedRow[role] = row[columnIndex];
	// 								}
	// 							}
	// 						});

	// 						standardizedData.push(standardizedRow);
	// 					});

	// 					storeDataInIndexedDB(standardizedData);
	// 				},
	// 			});
	// 		} catch(e) {
	// 			console.log('error', e)
	// 		} 

	// 	}
	// }


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
