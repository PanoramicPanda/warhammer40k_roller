let debug = false;

// Init counts
let countMetOrExceeded = 0;
let countCrit = 0;
let countBelow = 0;
let countFail = 0;

// Init natural roll breakdown array for standard 6-sided dice
let naturalRollBreakdown = Array(6).fill(0);

// Init variables to track whether dice should explode and explosion settings
let explodingDice = false;
let explosionNumber = 6;
let chainExploding = true;

// Init Tracked things
let trackedIds = {};
let rollBreakdown = {};
let allResults = [];
let modifier = 0;
let me = '';

// Init html objects
let diceForm = document.getElementById('diceForm');
let customTypeField = document.getElementById('customType');
let rollTypeField = document.getElementById('rollType');
let numDiceField = document.getElementById('numDice');
let targetValueField = document.getElementById('targetValue');
let modifierField = document.getElementById('modifier');
let explodingNumberField = document.getElementById('explodingNumber');
let performRollButton = document.getElementById('performRollBtn');
let validationOutputContainer = document.getElementById('validationOutput');
let explodingDiceField = document.getElementById("explodingDice");
let chainExplodingField = document.getElementById("chainExploding");
let treatAsD3Field = document.getElementById("treatAsD3");
let modifiedRollBreakdownTableContainer = document.getElementById("modifiedRollBreakdownTable");
let naturalRollBreakdownTableContainer = document.getElementById("naturalRollBreakdownTable");
let totalResultsTableContainer = document.getElementById("totalResultsTable");
let customRollContainer = document.getElementById("customRollContainer");
let totalResultsDivContainer = document.getElementById("totalResultsDiv");
let naturalResultsDivContainer = document.getElementById("naturalResultsDiv");
let modifiedRollBreakdownDivContainer = document.getElementById("modifiedRollBreakdownDiv");


window.onload = function () {
    // Add event listeners for input validation
    diceForm.addEventListener('input', validateForm);
    diceForm.addEventListener('select', validateForm);
    customTypeField.addEventListener('focus', function() { this.select(); });
    numDiceField.addEventListener('focus', function() { this.select(); });
    targetValueField.addEventListener('focus', function() { this.select(); });
    modifierField.addEventListener('focus', function() { this.select(); });
    explodingNumberField.addEventListener('focus', function() { this.select(); });

    // Call initial setup stuff to make sure states are correct
    checkExplosion();
    checkRollType();
    validateForm();
}

// Gets the username of the user and stores it for use in messages
async function findMe(){
    me = await TS.players.whoAmI().then(result => result.name);
}

// Runs form validation
function validateForm(){
    let validationMessages = [];

    // Reset styles for all fields to default
    customTypeField.style.borderColor = "";
    numDiceField.style.borderColor = "";
    targetValueField.style.borderColor = "";
    modifierField.style.borderColor = "";
    explodingNumberField.style.borderColor = "";
    totalResultsDivContainer.style.display = "none";
    naturalResultsDivContainer.style.display = "none";
    modifiedRollBreakdownDivContainer.style.display = "none";

    // Custom Type must have a value when used
    if (rollTypeField.value === "Custom" && customTypeField.value === "") {
        validationMessages.push("Custom Type must have a value.");
        customTypeField.style.borderColor = "var(--ts-color-danger)";
    }

    // You cannot roll less than 1 die or more than 40 at a time (TaleSpire limitation)
    if (numDiceField.value < 1 || numDiceField.value > 40) {
        validationMessages.push("Number of Dice must be between 1 and 40.");
        numDiceField.style.borderColor = "var(--ts-color-danger)";
    }

    // You cannot aim to roll less than 1 and more than 12 (D6+6)
    if (targetValueField.value < 1 || targetValueField.value > 12) {
        validationMessages.push("Target Value must be between 1 and 12.");
        targetValueField.style.borderColor = "var(--ts-color-danger)";
    }

    // You cannot have a modifier less than -6 or greater than 6. I don't know Warhammer enough to know if this is enough.
    if (modifierField.value < -6 || modifierField.value > 6) {
        validationMessages.push("Modifier per Die Value must be between -6 and 6.");
        modifierField.style.borderColor = "var(--ts-color-danger)";
    }

    // You cannot explode on a 1
    if ((explodingNumberField.value < 2 || explodingNumberField.value > 6) && explodingDiceField.checked) {
        validationMessages.push("Explosion Number must be between 2 and 6.");
        explodingNumberField.style.borderColor = "var(--ts-color-danger)";
    }

    // Display all validation messages and disable the Roll button if there are validation errors
    validationOutputContainer.innerHTML = validationMessages.join('<br>');
    if (validationMessages.length > 0){
        performRollButton.disabled = true
        validationOutputContainer.style.display = "block";
    } else{
        performRollButton.disabled = false;
        validationOutputContainer.style.display = "none";
    }
}

// Resets the form
function resetForm() {
    // Reset all form elements to their default values
    rollTypeField.value = "Hit Roll";
    customTypeField.value = "";
    numDiceField.value = "5";
    targetValueField.value = "3";
    modifierField.value = "0";
    explodingDiceField.checked = false;
    explodingNumberField.value = "6";
    chainExplodingField.checked = false;
    treatAsD3Field.checked = false;

    // Call initial setup stuff to make sure states are correct
    checkRollType();
    checkExplosion();
    validateForm();
}

// Handles visibility checks for Custom Roll Type
function checkRollType() {
    let rollType = rollTypeField.value;

    // If the selected roll type is "Custom", enable the custom roll type input box
    if (rollType === "Custom") {
        customRollContainer.style.display='';
        customTypeField.style.display='';
        customTypeField.disabled = false;
    } else {
        // Otherwise, disable the custom roll type input box and clear any text in it
        customTypeField.value = "";
        customRollContainer.style.display='none';
        customTypeField.style.display='none';
        customTypeField.disabled = true;
    }
}

// Gets the dice together and sends it over to TaleSpire
function performRoll() {
    // Reset the counts and roll breakdowns
    countMetOrExceeded = 0;
    countCrit = 0;
    countBelow = 0;
    countFail = 0;
    rollBreakdown = {}
    naturalRollBreakdown = Array(6).fill(0);

    // Get the roll type from the dropdown
    let rollType = rollTypeField.value;

    // If the roll type is "Custom", get the custom roll type from the input box
    if (rollType === "Custom") {
        rollType = customTypeField.value;
    }

    // Get values from the form
    const numDice = numDiceField.value;
    modifier = parseInt(modifierField.value);
    explodingDice = explodingDiceField.checked;
    explosionNumber = parseInt(explodingNumberField.value);
    chainExploding = chainExplodingField.checked;

    // Construct the roll
    const rollDesc = numDice + 'd6';

    // Send a notification to the board with our parameters
    TS.symbiote.sendNotification(me, rolledMessage());

    // Call the putDiceInTray method with the roll description and roll type
    TS.dice.putDiceInTray([{name: rollType, roll: rollDesc}], true)
        .then((rollId) => {
            // The dice roll has been initiated. Store the ID in our TrackedIds
            if (debug) console.log("Roll initiated. Roll ID:", rollId);
            trackedIds[rollId] = 1
        })
        .catch((error) => {
            // Something went wrong initiating the dice roll.
            console.error("Error initiating roll:", error);
        });
}

// TaleSpire will call this after a die roll because of our manifest
// Takes a look at the roll and handles it if it's one we made
async function handleRollResult(rollEvent) {
    if (trackedIds[rollEvent.payload.rollId] == undefined) {
        // If we haven't tracked that roll, ignore it because it's not from us
        return;
    }

    if (debug) console.log("roll event", rollEvent);

    // Get the results groups from the roll event
    const resultsGroups = rollEvent.payload.resultsGroups;

    // Process each results group
    for (let group of resultsGroups) {
        // Get the roll results from the group
        const results = group.result.results;

        // Add the results to allResults
        allResults = allResults.concat(results);

        let processedResults = results;

        // If the "Treat as D3" checkbox is checked, divide the results by 2 and round up
        if (treatAsD3Field.checked) {
            processedResults = results.map(result => Math.ceil(result / 2));
        }

        // Check for explosions before updating results
        let explodingDiceCount = 0;
        if (explodingDice) { // check if explodingDice checkbox is ticked
            explodingDiceCount = checkAndHandleExplosions(results);
        }

        // Process each result for debugging
        for (let result of results) {
            if (debug) console.log("roll result:", result);
        }

        // If we have dice to explode and either chain exploding is checked or this is the first explosion for this chain
        if (explodingDice && explodingDiceCount > 0 && (chainExploding || trackedIds[rollEvent.payload.rollId] === 1)) {
            // create new promise
            const dicePromise = new Promise((resolve, reject) => {
                const rollDesc = explodingDiceCount + 'd6';
                // Send a notification that our dice exploded
                TS.symbiote.sendNotification(me, `My dice exploded! I'm rolling another <color="green">${rollDesc}<color="white">.`);

                // Call the putDiceInTray method with the roll description and roll type
                TS.dice.putDiceInTray([{name: "Exploding", roll: rollDesc}], true)
                    .then((newRollId) => {
                        if (debug) console.log("Roll initiated. Roll ID:", newRollId);
                        if (chainExploding) {
                            trackedIds[newRollId] = trackedIds[rollEvent.payload.rollId] + 1;
                        } else {
                            trackedIds[newRollId] = Math.min(trackedIds[rollEvent.payload.rollId] + 1, 2);
                        }

                        resolve();
                    })
                    .catch((error) => {
                        console.error("Error initiating roll:", error);

                        reject();
                    });
            });

            // Await the promise so that all our explosion are done before we move on
            try {
                await dicePromise;
            } catch(e) {
                console.error("Promise rejected:", e);
            }
        }


    }

    // After processing the roll event, remove its rollId from trackedIds
    delete trackedIds[rollEvent.payload.rollId];

    // Only update the HTML after all rolls are done
    if (Object.values(trackedIds).every(value => value === 1)) {
        const targetValue = parseInt(targetValueField.value);
        const modifier = parseInt(modifierField.value);

        // Now update the results
        updateResults(allResults, targetValue, modifier, true);
        allResults = [];
    }
}

// Process the roll results and updates the page
function updateResults(results, targetValue, modifier, updateHTML) {
    let processedResults = results;
    let treatAsD3 = treatAsD3Field.checked;
    if (treatAsD3) {
        processedResults = results.map(result => Math.ceil(result / 2));
    }

    // Process each result
    for (let i = 0; i < processedResults.length; i++) {
        let result = results[i];

        // If treating as d3, adjust naturalRollBreakdown indexing
        if (treatAsD3) {
            naturalRollBreakdown[processedResults[i] - 1]++;
        } else {
            naturalRollBreakdown[result - 1]++;
        }

        // If result is a natural 1 or 6, update the corresponding counters
        if (result === 6) {
            countCrit++;
        } else if (result === 1) {
            countFail++;
        }

        // Apply the modifier
        result = processedResults[i] + modifier;

        // Update the roll breakdown
        rollBreakdown[result] = (rollBreakdown[result] || 0) + 1;

        // Update counts for the modified roll excluding natural 1's and 6's
        if (results[i] !== 1 && results[i] !== 6) {
            if (result >= targetValue) {
                countMetOrExceeded++;
            } else if (result < targetValue) {
                countBelow++;
            }
        }
    }

    if (updateHTML) {
        totalResultsDivContainer.style.display ="";
        naturalResultsDivContainer.style.display ="";

        // Check if treatAsD3 is checked
        if (treatAsD3Field.checked) {
            // Hide total results table
            totalResultsDivContainer.style.display ="none";

            naturalRollBreakdownTableContainer.innerHTML = naturalRollTable(3);

        } else {
            // Update the total results
            totalResultsTableContainer.innerHTML = resultsTable();
            TS.symbiote.sendNotification(me, resultsMessage());

            naturalRollBreakdownTableContainer.innerHTML = naturalRollTable(6);

        }
        TS.symbiote.sendNotification(me, dieCountMessage());
        // Only update the modified roll breakdown if a modifier is applied
        if (modifier != 0) {
            modifiedRollBreakdownDivContainer.style.display ="";
            // Update the modified roll breakdown
            let modifiedTableRows = "<tr><th>Roll Result</th><th>Count</th></tr>";
            // Get minimum and maximum roll results
            let minRoll = Math.min(...Object.keys(rollBreakdown).map(Number));
            let maxRoll = Math.max(...Object.keys(rollBreakdown).map(Number));
            for (let i = minRoll; i <= maxRoll; i++) {
                modifiedTableRows += `<tr><td>${i}</td><td>${rollBreakdown[i] || 0}</td></tr>`;
            }
            modifiedRollBreakdownTableContainer.innerHTML = modifiedTableRows;
            TS.symbiote.sendNotification(me, modCountMessage());
        } else {
            modifiedRollBreakdownDivContainer.style.display ="none";
            modifiedRollBreakdownTableContainer.innerHTML = "";
        }
        changeTableColumns();
    }
}

// Handles the visibility of Exploding Die elements
function checkExplosion() {
    // Get the divs for the explosion number and chain exploding
    const explodingNumberDiv = document.getElementById("explodingNumberDiv");
    const chainExplodingDiv = document.getElementById("chainExplodingDiv");

    // If exploding dice is checked, show the explosion number and chain exploding divs
    if (explodingDiceField.checked) {
        explodingNumberDiv.style.display = "";
        chainExplodingDiv.style.display = "";
        explodingNumberField.style.display = "";
        chainExplodingField.style.display = "";
    } else {
        // Otherwise, hide them
        explodingNumberDiv.style.display = "none";
        chainExplodingDiv.style.display = "none";
        explodingNumberField.style.display = "none";
        chainExplodingField.style.display = "none";
    }
}

// Gets the count of how many die are exploding
function checkAndHandleExplosions(results) {
    if (treatAsD3Field.checked || explodingNumberField.value <= 1) {
        return 0;
    }
    const explodingNumber = parseInt(explodingNumberField.value);
    let explodingDiceCount = 0;


    // Go through the array of roll results
    for (let result of results) {
        // If the result is equal to or above the explosion number, increment the exploding dice count
        if (result >= explodingNumber) {
            explodingDiceCount++;
        }
    }

    if (debug) console.log(`Checked for explosions on ${explodingNumber}: found ${explodingDiceCount} exploding dice.`);
    return explodingDiceCount;
}

// Gets the message together when you start a roll
function rolledMessage() {

    if (me==='') findMe();

    let message = '<color="orange"><size=120%><align="center">';

    if (rollTypeField.value == 'Custom') {
        message += `${customTypeField.value}`;
    } else {
        message += `${rollTypeField.value}`;
    }
    let die = treatAsD3Field.checked ? 3 : 6;

    message += `<color="white"><size=100%><align="left">\n<color="white">I'm rolling <color="green">${numDiceField.value}d${die}<color="white">`;

    if (modifierField.value != 0) {
        message += ` with a modifier of <color="green">${modifierField.value}<color="white">`;
    }
    message += `.\n\nI'm aiming to roll a <color="green">${targetValueField.value}<color="white"> or above.\n\n`;

    if (explodingDiceField.checked) {
        message += `My dice will be exploding on results of <color="green">${explodingNumberField.value}<color="white"> and above`;
        if (chainExplodingField.checked){
            message += ` and they will <color="green">keep on exploding<color="white">`;
        }
        message += '.';
    }

    return message;
}

// Makes the message for the Total Results table
function resultsMessage() {
    return `<size=120%><color="orange">Total Results<size=100%><color="white">\n
<b>Auto Fail (1):</b>  ${countFail}
<b>Below Target:</b>  ${countBelow}
<b>Met/Exceeded:</b>  ${countMetOrExceeded}
<b>Auto Crit (6):</b>  ${countCrit}
<b>Total Successes:</b>  ${countMetOrExceeded + countCrit}
`;
}

// Makes the message for the Die Count table
function dieCountMessage() {
    let max = treatAsD3Field.checked ? 3 : 6;
    let message = '<size=120%><color="orange">Die Counts<size=100%><color="white">\n\n';
    for (let i = 0; i < max; i++) {
        message += `<b>${i + 1}:</b>  ${naturalRollBreakdown[i] || 0}\n`;
    }
    return message;
}

// Makes the message for the Modified Counts table
function modCountMessage(){
    let message = '<size=120%><color="orange">Modified Counts<size=100%><color="white">\n\n';
    let minRoll = Math.min(...Object.keys(rollBreakdown).map(Number));
    let maxRoll = Math.max(...Object.keys(rollBreakdown).map(Number));
    for (let i = minRoll; i <= maxRoll; i++) {
        message += `<b>${i}:</b>  ${rollBreakdown[i] || 0}\n`;
    }
    return message;
}

// Makes the HTML for the Results Table
function resultsTable(){
    return `
<tr><th>Outcome</th><th>Count</th></tr
<tr><td>Auto Fail (1)</td><td>${countFail}</td></tr>
<tr><td>Below Target</td><td>${countBelow}</td></tr>
<tr><td>Met/Exceeded</td><td>${countMetOrExceeded}</td></tr>
<tr><td>Auto Crit (6)</td><td>${countCrit}</td></tr>
<tr><td>Total Successes</td><td>${countMetOrExceeded+countCrit}</td></tr>
`;
}

// Makes the HTML for the Die Count Table
function naturalRollTable(maxResult){
    let naturalTableRows = "<tr><th>Die Face</th><th>Count</th></tr>";
    for (let i = 0; i < maxResult; i++) {
        naturalTableRows += `<tr><td>${i + 1}</td><td>${naturalRollBreakdown[i] || 0}</td></tr>`;
    }
    return naturalTableRows
}

// Changes how many columns are in the Count row based on if Modifier table is used or not
function changeTableColumns(){
    // Check if one of the divs is not displayed
    if (naturalResultsDivContainer.style.display === 'none' || modifiedRollBreakdownDivContainer.style.display === 'none') {
        // Change the .count-wrapper class property
        document.getElementsByClassName('count-wrapper')[0].style.gridTemplateColumns = '1fr';
    } else {
        document.getElementsByClassName('count-wrapper')[0].style.gridTemplateColumns = '2fr 2fr';
    }
}