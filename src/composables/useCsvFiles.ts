import { ref } from 'vue';
import Papa from 'papaparse';
import {
	type StandardizedData,
	type AZStandardizedData,
	type USStandardizedData,
	DBName,
	IndetermRateType
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
	const DBname = ref<DBName | null>(null);
	
	const componentName = ref<string>('');
	const previewData = ref<string[][]>([]);
	const columns = ref<string[]>([]);
	const showModal = ref<boolean>(false);
	const deckType = ref<DBName | null>(null);
	const indetermRateType = ref<IndetermRateType>(IndetermRateType.DEFAULT);

	async function parseCSVForFullProcessing(): Promise<void> {
		console.log('deckType', deckType.value)
		if (!file.value) {
			return;
		}
		const fileNameExists = DBstore.checkFileNameAvailable(file.value.name);

		if (!fileNameExists) {
			DBstore.setComponentFileIsUploading(componentName.value);
			if (deckType.value === DBName.AZ) {
				try {
					await processAZData(file.value);
				} catch (e) {
					console.error('Error during CSV parsing', e);
				}
			} // Add this closing bracket
			if (deckType.value === DBName.US) {
				try {
					console.log('going in on processing US data')
					await processUSData(file.value);
				} catch (e) {
					console.error('Error during CSV parsing', e);
				}
			}
		} else {
			alert('File with this name already exists.');
			console.log('File with this name already exists.');
		}
	}

	async function processUSData(fileToProcess: File) {
		console.log('processing US data', indetermRateType.value)
		Papa.parse(fileToProcess, {
			header: false,
			skipEmptyLines: true,
			complete(results: Papa.ParseResult<string[]>) {
				const dataStartIndex = startLine.value - 1;
				const fullData = results.data.slice(dataStartIndex);
				const standardizedData: USStandardizedData[] = [];

				console.log('Sample Row:', fullData[0]);

				fullData.forEach((row: string[], rowIndex: number) => {
					const standardizedRow: USStandardizedData = {
						npa: 0,
						nxx: 0,
						interRate: 0,
						intraRate: 0,
						ijRate: 0,
					};

					let interRate = 0;
					let intraRate = 0;

					columnRoles.value.forEach((role, index) => {
						if (role && index < row.length) {
							const value = row[index].trim();
							
							switch (role) {
								case 'NPA':
									standardizedRow.npa = processNPA(value);
									break;
								case 'NXX':
									standardizedRow.nxx = parseInt(value, 10);
									break;
								case 'NPANXX':
									const [npa, nxx] = processNPANXX(value);
									standardizedRow.npa = npa;
									standardizedRow.nxx = nxx;
									break;
								case 'inter':
									interRate = parseFloat(value);
									standardizedRow.interRate = interRate;
									break;
								case 'intra':
									intraRate = parseFloat(value);
									standardizedRow.intraRate = intraRate;
									break;
								case 'indeterm':
									standardizedRow.ijRate = parseFloat(value);
									break;
							}
						}
					});

					// Handle indeterminate rate based on user selection
					if (indetermRateType.value === 'inter') {
						standardizedRow.ijRate = interRate;
					} else if (indetermRateType.value === 'intra') {
						standardizedRow.ijRate = intraRate;
					} else if (indetermRateType.value === 'default' && standardizedRow.ijRate === 0) {
						// If 'default' is selected and no explicit ijRate was set, use intraRate as fallback
						standardizedRow.ijRate = intraRate;
					}
					
					const isValidNPA = !isNaN(standardizedRow.npa);
					const isValidNXX = !isNaN(standardizedRow.nxx);
					const isValidRates = !isNaN(standardizedRow.interRate) && 
										 !isNaN(standardizedRow.intraRate) && 
										 !isNaN(standardizedRow.ijRate);

					if (isValidNPA && isValidNXX && isValidRates) {
						standardizedData.push(standardizedRow);
					} else {
						console.error('Issue parsing US file row', rowIndex, standardizedRow);
					}
				});
				
				storeDataInIndexedDB(standardizedData);
			},
			error: function(error) {
				console.error('Error parsing CSV:', error);
				throw error;
			}
		});
	}

	function processNPA(value: string): number {
		let processedNpa = value;
		if (processedNpa.startsWith('1') && processedNpa.length === 4) {
			processedNpa = processedNpa.slice(1);
		}
		return parseInt(processedNpa, 10);
	}

	function processNPANXX(value: string): [number, number] {
		let processedValue = value;
		if (processedValue.startsWith('1') && processedValue.length === 7) {
			processedValue = processedValue.slice(1);
		}
		const npa = parseInt(processedValue.slice(0, 3), 10);
		const nxx = parseInt(processedValue.slice(3), 10);
		return [npa, nxx];
	}

	async function processAZData(fileToProcess: File) {
		Papa.parse(fileToProcess, {
			header: false,
			skipEmptyLines: true,
			complete(results: Papa.ParseResult<string[]>) {
				const dataStartIndex = startLine.value - 1;
				const fullData = results.data.slice(dataStartIndex);
				const standardizedData: AZStandardizedData[] = [];

				fullData.forEach((row: string[]) => {
					const standardizedRow: AZStandardizedData = {
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
							}
						}
					});
					
					const isValidDestName = typeof standardizedRow.destName === 'string' && standardizedRow.destName.length > 0;
					const isValidDialCode = !isNaN(standardizedRow.dialCode);
					const isValidRate = !isNaN(standardizedRow.rate);

					if (isValidDestName && isValidDialCode && isValidRate) {
						standardizedData.push(standardizedRow);
					} else {
						console.error('Issue parsing AZ file row', standardizedRow);
					}
				});
				
				storeDataInIndexedDB(standardizedData);
			},
			error: function(error) {
				console.error('Error parsing CSV:', error);
				throw error;
			}
		});
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
			console.error('error uploading file');
		}
	}

	//function reaches out to IndesBB composable to store data
	async function storeDataInIndexedDB(data: StandardizedData[]) {	
		console.log('storing with ', DBname.value, componentName.value)
		try {
			if (file.value) {
				await storeInIndexedDB(
					data,
					DBname.value as DBName,
					file.value.name,
					componentName.value
				);
			}
		} catch (error) {
			console.error('Error storing data in IndexedDB:', error);
		}
	}

	
	async function removeFromDB() {
		let storeName = DBstore.getStoreNameByComponent(
			componentName.value
		);
		// resetLocalState();
		await deleteObjectStore(DBname.value as DBName, storeName);
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
		removeFromDB,
		deckType,
		indetermRateType
	};
}
