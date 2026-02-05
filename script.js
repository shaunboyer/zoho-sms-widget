ZOHO.embeddedApp.on("PageLoad", function(data) {
    console.log("Widget loaded, initializing...");
    // Initialize the widget with connection name
    ZOHO.embeddedApp.init({
        scopes: "ZohoCRM.modules.ALL"
    }).then(function() {
        console.log("Widget initialized successfully");
        loadSMSMessages();
    }).catch(function(error) {
        console.error("Init error:", error);
        showNoMessages("Failed to initialize widget. Error: " + JSON.stringify(error));
    });
});

function loadSMSMessages() {
    console.log("Loading SMS messages...");
    
    // Get entity ID from the page
    ZOHO.CRM.UI.Record.get().then(function(data) {
        console.log("Current record data:", data);
        var recordId = data.data.id;
        
        // Get the full record details
        ZOHO.CRM.API.getRecord({
            Entity: "SMS_Enrollments",
            RecordID: recordId
        }).then(function(response) {
            console.log("Got enrollment record:", response);
            var record = response.data[0];
            
            // Try multiple possible field names for the contact
            var contactId = null;
            if (record.Contacts && record.Contacts.id) {
                contactId = record.Contacts.id;
            } else if (record.Contact && record.Contact.id) {
                contactId = record.Contact.id;
            } else if (record.Contact_Name && record.Contact_Name.id) {
                contactId = record.Contact_Name.id;
            }
            
            console.log("Contact ID:", contactId);
            console.log("Full record:", JSON.stringify(record));
            
            if (contactId) {
                fetchSMSMessages(contactId);
            } else {
                showNoMessages("No contact found. Available fields: " + Object.keys(record).join(", "));
            }
        }).catch(function(error) {
            console.error("Error fetching enrollment record:", error);
            showNoMessages("Error loading enrollment: " + JSON.stringify(error));
        });
    }).catch(function(error) {
        console.error("Error getting current record:", error);
        showNoMessages("Error getting record ID: " + JSON.stringify(error));
    });
}

function fetchSMSMessages(contactId) {
    console.log("Fetching SMS messages for contact:", contactId);
    
    // Try using coql query instead
    var query = "select Message_Date, Message, twiliosmsextension0__Status, Message_Type from twiliosmsextension0__Sent_SMS where Contacts = '" + contactId + "'";
    console.log("COQL Query:", query);
    
    ZOHO.CRM.API.coql(query).then(function(response) {
        console.log("COQL response:", response);
        document.getElementById("loading").style.display = "none";
        document.getElementById("messages-container").style.display = "block";
        
        if (response.data && response.data.length > 0) {
            console.log("Found " + response.data.length + " messages");
            displayMessages(response.data);
        } else {
            showNoMessages("No SMS messages found for this contact.");
        }
    }).catch(function(error) {
        console.error("COQL error, trying searchRecord:", error);
        
        // Fallback to searchRecord
        var searchCriteria = "(Contacts:equals:" + contactId + ")";
        
        ZOHO.CRM.API.searchRecord({
            Entity: "twiliosmsextension0__Sent_SMS",
            Type: "criteria",
            Query: searchCriteria
        }).then(function(response) {
            console.log("Search response:", response);
            document.getElementById("loading").style.display = "none";
            document.getElementById("messages-container").style.display = "block";
            
            if (response.data && response.data.length > 0) {
                displayMessages(response.data);
            } else {
                showNoMessages("No SMS messages found.");
            }
        }).catch(function(error2) {
            console.error("Search error:", error2);
            showNoMessages("Error: " + JSON.stringify(error2));
        });
    });
}

function displayMessages(messages) {
    console.log("Displaying messages:", messages);
    var tbody = document.getElementById("messages-body");
    tbody.innerHTML = "";
    
    messages.forEach(function(msg) {
        var row = tbody.insertRow();
        
        row.insertCell(0).textContent = formatDate(msg.Message_Date) || "N/A";
        row.insertCell(1).textContent = msg.Message || "N/A";
        row.insertCell(2).textContent = msg.twiliosmsextension0__Status || "N/A";
        row.insertCell(3).textContent = msg.Message_Type || "N/A";
    });
    
    document.getElementById("messages-table").style.display = "table";
    console.log("Messages displayed successfully");
}

function formatDate(dateString) {
    if (!dateString) return "N/A";
    var date = new Date(dateString);
    return date.toLocaleString();
}

function showNoMessages(message) {
    console.log("Showing message:", message);
    document.getElementById("loading").style.display = "none";
    document.getElementById("messages-container").style.display = "block";
    document.getElementById("messages-table").style.display = "none";
    document.getElementById("no-messages").textContent = message;
    document.getElementById("no-messages").style.display = "block";
}
