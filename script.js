ZOHO.embeddedApp.on("PageLoad", function(data) {
    console.log("Widget loaded, initializing...");
    // Initialize the widget
    ZOHO.embeddedApp.init().then(function() {
        console.log("Widget initialized successfully");
        loadSMSMessages();
    }).catch(function(error) {
        console.error("Init error:", error);
        showNoMessages("Failed to initialize widget: " + error);
    });
});

function loadSMSMessages() {
    console.log("Loading SMS messages...");
    
    // Get the current SMS Enrollment record
    ZOHO.CRM.API.getRecord({
        Entity: "SMS_Enrollments",
        approved: "both"
    }).then(function(response) {
        console.log("Got enrollment record:", response);
        var record = response.data[0];
        
        // Check if there's a contact associated
        if (record.Contacts && record.Contacts.id) {
            var contactId = record.Contacts.id;
            console.log("Contact ID found:", contactId);
            fetchSMSMessages(contactId);
        } else if (record.Contact && record.Contact.id) {
            // Try alternate field name
            var contactId = record.Contact.id;
            console.log("Contact ID found (alternate):", contactId);
            fetchSMSMessages(contactId);
        } else {
            console.log("Full record data:", JSON.stringify(record));
            showNoMessages("No contact associated with this enrollment.");
        }
    }).catch(function(error) {
        console.error("Error fetching enrollment record:", error);
        showNoMessages("Error loading enrollment: " + JSON.stringify(error));
    });
}

function fetchSMSMessages(contactId) {
    console.log("Fetching SMS messages for contact:", contactId);
    
    // Search for SMS messages related to this contact
    var searchCriteria = "(Contacts:equals:" + contactId + ")";
    console.log("Search criteria:", searchCriteria);
    
    ZOHO.CRM.API.searchRecord({
        Entity: "twiliosmsextension0__Sent_SMS",
        Type: "criteria",
        Query: searchCriteria
    }).then(function(response) {
        console.log("SMS search response:", response);
        document.getElementById("loading").style.display = "none";
        document.getElementById("messages-container").style.display = "block";
        
        if (response.data && response.data.length > 0) {
            console.log("Found " + response.data.length + " messages");
            displayMessages(response.data);
        } else {
            console.log("No messages found");
            showNoMessages("No SMS messages found for this contact.");
        }
    }).catch(function(error) {
        console.error("Error fetching SMS messages:", error);
        showNoMessages("Error loading messages: " + JSON.stringify(error));
    });
}

function displayMessages(messages) {
    console.log("Displaying messages:", messages);
    var tbody = document.getElementById("messages-body");
    tbody.innerHTML = "";
    
    messages.forEach(function(msg) {
        var row = tbody.insertRow();
        
        // Using your exact field API names
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
    console.log("Showing no messages:", message);
    document.getElementById("loading").style.display = "none";
    document.getElementById("messages-container").style.display = "block";
    document.getElementById("messages-table").style.display = "none";
    document.getElementById("no-messages").textContent = message;
    document.getElementById("no-messages").style.display = "block";
}
