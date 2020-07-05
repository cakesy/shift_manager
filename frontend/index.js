import {initializeBlock,useBase,useRecords, FieldPickerSynced, useGlobalConfig,  TablePickerSynced, expandRecord, useWatchable,
    ViewPickerSynced, Button,
    Label, Box,Input,useSynced,
    FormField,
    TextButton} from '@airtable/blocks/ui';
    
import {FieldType} from '@airtable/blocks/models';

import React, { useEffect, useState } from 'react';

import {settingsButton} from '@airtable/blocks';

const GlobalConfigKeys = {
    TABLE_ID: 'tableId',
    VIEW_ID: 'viewId',
    X_FIELD_ID: 'xFieldId',
};



function ShiftManager(shouldShowSettingsButton) {

    
	const base = useBase();
	const globalConfig = useGlobalConfig();

	const [NumberOfDays, setNumberOfDays] =  useState("5");
	const [StartTime, setStartTime] =  useState("9");
	const [NumberOfHours, setNumberOfHours] =  useState("9");
	const [PeoplePerHour, setPeoplePerHour] =  useState("2");
	const [MaxHourPerDay, setMaxHourPerDay] =  useState("8");
   
    const tableId = globalConfig.get(GlobalConfigKeys.TABLE_ID);
	
	const table = base.getTableByIdIfExists(tableId);
	const records = useRecords(table);
    
    var errorMessage = "";
    
    
    return (
        <div>
            <Box  padding={2} >
					<FormField label="Table" >
						<TablePickerSynced globalConfigKey={GlobalConfigKeys.TABLE_ID} />
					</FormField>
				
					<Box  display='flex' >
					<Label htmlFor="NumberOfDays" width="30%">Number of Days</Label>
				 	 <Input  id="NumberOfDays"  variant="primary" 
						  value={NumberOfDays}
						  onChange={e => setNumberOfDays(e.target.value)}
						  placeholder="Number of Days"
						  
						/>
					</Box>
					<Box  display='flex' paddingTop={2}>
					<Label htmlFor="StartTime" width="30%">Start Time</Label>
				 	 <Input  id="StartTime"  variant="primary" 
						  value={StartTime}
						  onChange={e => setStartTime(e.target.value)}
						  placeholder="Time in hours"
						  
						/>
					</Box>
					<Box  display='flex' paddingTop={2}>
					<Label htmlFor="NumberOfHours" width="30%">Daily hours open</Label>
				 	 <Input  id="NumberOfHours"  variant="primary" 
						  value={NumberOfHours}
						  onChange={e => setNumberOfHours(e.target.value)}
						  placeholder="In hours"
						/>
					</Box>
					<Box  display='flex' paddingTop={2}>
					<Label htmlFor="PeoplePerHour" width="30%">People on at once</Label>
				 	 <Input  id="PeoplePerHour"  variant="primary" 
						  value={PeoplePerHour}
						  onChange={e => setPeoplePerHour(e.target.value)}
						  placeholder="Number of people"
						/>
					</Box>
					<Box paddingTop={2} >
					   <Button onClick={() => { ProcessShifts() }}
						icon="edit" id="clicktable">
						Process shifts
					  </Button>
					</Box>
			</Box>
        </div>
    );
    
    async function createNewSingleLineTextField(table, name) {
		if (table.unstable_hasPermissionToCreateField(name, FieldType.SINGLE_LINE_TEXT)) {
			await table.unstable_createFieldAsync(name, FieldType.SINGLE_LINE_TEXT);
		}
	}
	
	
	
    // process the table
	function ProcessShifts() {
			
		const toggle = (record) => {
			table.updateRecordAsync(
				record, {[completedFieldId]: !record.getCellValue(completedFieldId)}
			);
		};
	
		var TotalStaffNumber = records.length;
   
	   //possible tables
	   var DaysTotalTime = new Array(NumberOfDays);
	   var GridHour = new Array(TotalStaffNumber);
	   var WorkerShift = new Array(TotalStaffNumber);
	   
	   //create total field
	   	if ( !table.getFieldIfExists("Total") ){
	  		createNewSingleLineTextField(table,"Total");
	  	}
	  	
	  	
	  	//create 2d array for hours per day
	   for (var i = 0; i < TotalStaffNumber; i++) { 
		 GridHour[i]=new Array(NumberOfDays);
	  	 for (var j = 0; j < NumberOfDays; j++) { 
		  		GridHour[i][j]=0;
		  		//console.log(" GridHour "+i+", "+j+" = "+GridHour[i][j]);
		  }
	   }
   	
       // create days time and day fields
	   for (var i = 0; i < NumberOfDays; i++) { 
		  DaysTotalTime[i]=NumberOfHours*PeoplePerHour;
		  
		  
		  if ( !table.getFieldIfExists("Day "+(i+1)) ){
		  		//table.unstable_createFieldAsync("Day "+(i+1),FieldType.SINGLE_LINE_TEXT);
		  		createNewSingleLineTextField(table,"Day "+(i+1));
		  }
	   }
	
	
	   var TotalPeopleTime = new Array(records.length);	
	   var counter=0;
	
	   //loop through each user, and get hours
		records.map(record => {
			if (record.getCellValueAsString('Hours').length>0){
			
				TotalPeopleTime[counter]=parseInt(record.getCellValueAsString('Hours'));
				
				console.log("people "+counter+" tot hour "+TotalPeopleTime[counter]);
				
			} else {
				TotalPeopleTime[counter]=40;
			}
			WorkerShift[counter]="";
			counter++;
		});
		
		var peopleCounter=0;
		
		console.log("loop through days "+DaysTotalTime.length+" tot hour "+NumberOfHours*PeoplePerHour+" MaxHourPerDay = "+MaxHourPerDay);
		  		
		//loop through each day  		
	   for (var i = 0; i < NumberOfDays; i++) { 
		  var DailyHours=NumberOfHours*PeoplePerHour;
		  
		  //fill up hours with people
		  while (DailyHours>0){
		  		var workedHours=0;
		  		
		  		if (DailyHours>MaxHourPerDay){
		  		
		  			 if (TotalPeopleTime[peopleCounter]>MaxHourPerDay){
						workedHours=MaxHourPerDay;
					} else {
		  				workedHours=TotalPeopleTime[peopleCounter];
		  			}
		  		} else {
		  			if (TotalPeopleTime[peopleCounter]>DailyHours){
		  				workedHours=DailyHours;
		  			} else {
		  				workedHours=TotalPeopleTime[peopleCounter];
		  			}
		  			
		  		}
		  		
		  		DailyHours=DailyHours-workedHours;
		  		
		  		TotalPeopleTime[peopleCounter]=TotalPeopleTime[peopleCounter]-workedHours;
		  		WorkerShift[peopleCounter]=WorkerShift[peopleCounter]+"Day "+(i+1)+" works "+workedHours+" hours, ";
		  		GridHour[peopleCounter][i]=workedHours;
		  		
		  		console.log(" set GridHour "+peopleCounter+", "+i+" = "+workedHours);
		  		
		  		console.log("  day "+i+" work "+DailyHours+" for "+peopleCounter+" workedHours "+workedHours+ " -> "+WorkerShift[peopleCounter]);
		  		peopleCounter++;
		  		if (peopleCounter>=records.length){
			  		peopleCounter=0;
		  		}
		  }
		  
	   }
		
		peopleCounter=0;
		
		//update all user data in table
		records.map(record => {
			var updateShift={};
			updateShift["Shifts"]= WorkerShift[peopleCounter];
			
			var totalHoursWorked = 0;
			for (var i = 0; i < NumberOfDays; i++) { 
		  
				  if ( table.getFieldIfExists("Day "+(i+1)) ){
				  		var dayname="Day "+(i+1);
						updateShift[ dayname]=GridHour[peopleCounter][i].toString();
						//console.log("peep "+peopleCounter+", "+i+" - "+dayname+" = "+toString(GridHour[peopleCounter][i])+" : "+GridHour[peopleCounter][i] );
				  }
				  totalHoursWorked=totalHoursWorked+parseInt(GridHour[peopleCounter][i]);
			   }
			    if ( table.getFieldIfExists("Total") ){
			    	updateShift[ "Total"]=totalHoursWorked.toString();
			    }
			
	    		
				table.updateRecordAsync(record, updateShift );
				peopleCounter++;
		});
	}	
}


initializeBlock(() => <ShiftManager />);
