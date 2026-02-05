ZOHO.embeddedApp.on("PageLoad", function(data) {
    // Initialize the widget
    ZOHO.embeddedApp.init().then(function() {
        loadSMSMessages();
    });
});

function loadSMSMessages() {
    // Get the current SMS Enrollment record
    ZOHO.CRM.API.getRecord({
        Entity: "SMS_Enrollments",
        approved: "both"
    }).then(function(response) {
        var record = response.data[0];
        
        // Check if there's a contact associated
        if (record.Contacts && record.Contacts.id) {
            var contactId = record.Contacts.id;
            fetchSMSMessages(contactId);
        } else {
            showNoMessages("No contact associated with this enrollment.");
        }
    }).catch(function(error) {
        console.error("Error fetching enrollment record:", error);
        showNoMessages("Error loading messages.");
    });
}

function fetchSMSMessages(contactId) {
    // Search for SMS messages related to this contact
    var searchCriteria = "(Contacts:equals:" + contactId + ")";
    
    ZOHO.CRM.API.searchRecord({
        Entity: "twiliosmsextension0__Sent_SMS",
        Type: "criteria",
        Query: searchCriteria
    }).then(function(response) {
        document.getElementById("loading").style.display = "none";
        document.getElementById("messages-container").style.display = "block";
        
        if (response.data && response.data.length > 0) {
            displayMessages(response.data);
        } else {
            showNoMessages("No SMS messages found.");
        }
    }).catch(function(error) {
        console.error("Error fetching SMS messages:", error);
        showNoMessages("Error loading messages.");
    });
}

function displayMessages(messages) {
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
}

function formatDate(dateString) {
    if (!dateString) return "N/A";
    var date = new Date(dateString);
    return date.toLocaleString();
}

function showNoMessages(message) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("messages-container").style.display = "block";
    document.getElementById("messages-table").style.display = "none";
    document.getElementById("no-messages").textContent = message;
    document.getElementById("no-messages").style.display = "block";
}