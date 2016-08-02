/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var Vibe = require('ui/vibe');
var Voice = require('ui/voice');
//TEMPORARY: put your Taskwarrior Inthe.am Token here (settings > API token), I need to do the configuration activity for entering your custom token.
var token = "YOUR_API_TOKEN";
function get_task_list(){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "https://inthe.am/api/v2/tasks/", true);
	xhr.setRequestHeader("Authorization", "Token " + token);
	xhr.onload = function () {
    if (xhr.readyState === xhr.DONE) {
			if (xhr.status === 200) {
					var obj = JSON.parse(xhr.responseText);
					var main = new UI.Menu();
					main.item(0, 0, { title: 'ADD TASK' });
					for (var i = 0, len = obj.length; i < len; ++i) {
     				var item = obj[i];
						//populate list
 						main.item(1, i, { title: item.description });
						//
					}
					main.on('select', function(e) {
   					 	 console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
    					 console.log('The item is titled "' + e.item.title + '"');
							 if(e.sectionIndex === 0){
								 //ADD TASK
								 Voice.dictate('start', true, function(e) {
  							 if (e.err) {
                 	console.log('Error: ' + e.err);
                  return;
                 }
                 var text = e.transcription;
								 var xhr_newtask = new XMLHttpRequest();
								 var value = '{"description":"' + text + '"}';

 								 xhr_newtask.open("POST", "https://inthe.am/api/v2/tasks/", true);
 								 xhr_newtask.setRequestHeader("Content-Type", "application/json");
								 xhr_newtask.setRequestHeader("Authorization", "Token " + token);
								 xhr_newtask.send(value);
});
							 }
						if(e.sectionIndex == 1){							
							 var selected_short_id = e.itemIndex;
							 var selected_obj=obj[selected_short_id];
							 var timeline_uuid = selected_obj.uuid;
							 var priority = "";
							 var due = "";
							 var tags = "";
							 var project = "";
							 if(typeof selected_obj.priority !== "undefined"){
								 priority = "Priority:  " + selected_obj.priority + "\n";
							 }
							 if(typeof selected_obj.due !== "undefined"){
								 var dateParsed = new Date(selected_obj.due);
								 var dd = padDateTime(dateParsed.getDate());
                 var mm = padDateTime(dateParsed.getMonth()+1);
								 var date = mm + "/" + dd;
								 due = "Due: " + date + "\n";
								 
								 //add to timeline
								 Pebble.getTimelineToken(function (token) {
								 	console.log('My timeline token is ' + token);
									var myToken = token;
									 
									 var xhr_timeline = new XMLHttpRequest();
									 xhr_timeline.open("PUT", "https://timeline-api.getpebble.com/v1/user/pins/" + timeline_uuid, true);
 								   xhr_timeline.setRequestHeader("Content-Type", "application/json");
 								   xhr_timeline.setRequestHeader("X-User-Token", myToken);
									 var timeline_pin_content = '{"id": "' + timeline_uuid + '","time": "' + selected_obj.due + '","layout": { "shortTitle": "' + selected_obj.description + '","type":"genericPin"}}';
									 xhr_timeline.send(timeline_pin_content);
								 });

						   }
							 if(typeof selected_obj.tags !== "undefined"){
								 tags = "Tags: " + selected_obj.tags + "\n";
						   }
							 if(typeof selected_obj.project !== "undefined"){
								 project = "Project: " + selected_obj.project + "\n";
						   }
							 var card = new UI.Card({
  								subtitle: selected_obj.description,
								  body: "Status: " + selected_obj.status + "\n" + "Urgency: " + selected_obj.urgency + "\n" + priority + due + tags + project,
								  style: "small"
							 });
						 	 card.on('click','up', function(btn){
								 var task_menu = new UI.Menu({
									  sections: [{
   								  items: [{
      						  	title: 'Set Task Done',
     							 	}, 
										{
      								title: 'Start Task'
    								},{
      								title: 'Stop Task'
    								},{
      								title: 'Delete Task'
    								}]
  								}]
								 });
								 task_menu.on('select', function(btn){
									 var selected_uuid = selected_obj.uuid;
									 var xhr_tasks = new XMLHttpRequest();
									 switch(btn.itemIndex){
										 case 0:
											
    									 xhr_tasks.open("DELETE", "https://inthe.am/api/v2/tasks/" + selected_uuid + "/", true);
											 xhr_tasks.setRequestHeader("Authorization", "Token " + token);
											 xhr_tasks.send(null);
											 Vibe.vibrate('long');
											 get_task_list();
											 break;
										 case 1:
											
    									 xhr_tasks.open("POST", "https://inthe.am/api/v2/tasks/" + selected_uuid + "/start/", true);
											 xhr_tasks.setRequestHeader("Authorization", "Token " + token);
											 xhr_tasks.send(null);
											 Vibe.vibrate('long');
											 get_task_list();
											 break;
										 case 2:
											
    									 xhr_tasks.open("POST", "https://inthe.am/api/v2/tasks/" + selected_uuid + "/stop'", true);
											 xhr_tasks.setRequestHeader("Authorization", "Token " + token);
											 xhr_tasks.send(null);
											 Vibe.vibrate('long');
											 card.hide();
											 break;
										 case 3:
											
    									 xhr_tasks.open("POST", "https://inthe.am/api/v2/tasks/" + selected_uuid + "/delete/", true);
											 xhr_tasks.setRequestHeader("Authorization", "Token " + token);
											 xhr_tasks.send(null);
											 Vibe.vibrate('long');
											 card.hide();
											 break;
									 }
								 });
								 task_menu.show();
							 });
							 card.show();
					}
  				});
 					main.show();
				}
		}
	};
	xhr.send(null);
}
function padDateTime(dt) {
    return dt < 10 ? "0"+dt : dt;
}
if(token != "YOUR_API_TOKEN"){
	get_task_list();
}
else{
	
	var error_card = new UI.Card({
  title: 'ERROR',
	subtitle: 'API Token not configured, open settings in Pebble app and enter API token!'
	
});
	error_card.show();

    Pebble.addEventListener("showConfiguration", function() {
    console.log("showing configuration");
        //change this url to yours
        Pebble.openURL('http://assets.getpebble.com.s3-website-us-east-1.amazonaws.com/pebble-js/configurable.html');
        });
        Pebble.addEventListener("webviewclosed", function(e) {
        console.log("configuration closed");
        // webview closed
        var options = JSON.parse(decodeURIComponent(e.response));
        console.log("Options = " + JSON.stringify(options));
        }); 

}

