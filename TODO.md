### Currrent objective and context

- We are curently loading sample data that is stored in @src/data/sample.
- The reason we are doing this is to make sure that our UI is woking correctly and that the data in those files is being stored in IndexedDB.
- There are 6 files in that folder and we are interested in 4 of them. This files are : AZtest.csv, AZtest1.csv, UStest.csv, UStest1.csv.

### Current state

- We have a function in @src/domains/shared/utils/utils.ts that is called loadSampleDecks. This function is called in the App.vue file.
- This function is supposed to load the sample data into IndexedDB.
- The function is called with the following parameters: [DBName.AZ, DBName.US].
- The function is supposed to load the sample data for AZ and US into IndexedDB.

Right now the funnction is working for the AZ files but not for the US files.

