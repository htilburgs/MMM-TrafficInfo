/*
//-------------------------------------------
MMM-MyTraffic
Copyright (C) 2019 - H. Tilburgs
MIT License
//-------------------------------------------
*/

Module.register('MMM-TT', {

	// Default values
	defaults: {
		showJams: true,				// Show Traffic jams
		showConstructions: true,		// Show Constructions
		showRadars: true,			// Show Radar controles
		preferredRoads: ['ALL'],		// Display only preferred roads - All is everything, other "A1",A2",..
		maxWidth: "500px",			// Max width wrapper
		largeIcons: true,			// Display Large or Small icons and information
		animationSpeed: 1000, 			// fade in and out speed
		initialLoadDelay: 1000,
		retryDelay: 2500,
		updateInterval: 60 * 1000		// every 1 minute
	},

			
	// Create lists of jams, construction-zones and radar positions, with their road name	
	MTR: null,	
	jams : [],
	constructions : [],
	radars : [],
	
	// Define stylesheet
	getStyles: function () {
		return ["MMM-TT.css"];
	},  

	// Define required scripts.
	getScripts: function () {
		return ["moment.js"];
	},

	// Define required translations.
	getTranslations: function () {
		// The translations for the default modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionary.
		// If you're trying to build your own module including translations, check out the documentation.
		return false;
	},
	
	start: function () {
		Log.info("Starting module: " + this.name);
		requiresVersion: "2.1.0",	
			
		// Set locales
		this.url = "https://www.anwb.nl/feeds/gethf"
		this.MTR = [];				// <-- Create empty MyTraffic array
		this.scheduleUpdate();     	// <-- When the module updates (see below)
	},

	getDom: function () {
		
		// creating the wrapper
		var wrapper = document.createElement("div");
		wrapper.className = "wrapper";
		wrapper.style.maxWidth = this.config.maxWidth;
	
		// The loading sequence
   		if (!this.loaded) {
            	wrapper.innerHTML = "Loading....";
           	wrapper.classList.add("bright", "light", "small");
            	
		return wrapper;
	}	
		
		if (this.config.largeIcons != false) {
			
			//Display Traffic Jam information
			if (this.config.showJams != false) {
			for (var j of this.jams) {	

				var warnWrapper = document.createElement("div");
				var icon = document.createElement("div");
				icon.classList.add('trafficicon-jam', 'small-icon');
				var event = document.createElement("div");
				event.className = "event xsmall";
				var information = document.createElement("div");
				information.className = "bold"
				if (typeof j.jam.startDate !== "undefined") {
					information.innerHTML = j.name + " - " + j.jam.startDate + " - " + (j.jam.distance/1000) + "KM";
					} else {
					information.innerHTML = j.name;
					}
				var description = document.createElement("div");
				description.className.add = "description xsmall";
				description.innerHTML = j.jam.description;
				var horLine = document.createElement("hr");
				event.appendChild(information);
				event.appendChild(description);
				warnWrapper.appendChild(icon);
				warnWrapper.appendChild(event);
				wrapper.appendChild(warnWrapper);
				wrapper.appendChild(horLine); 
			  }
		  }

			//Display Traffic Camera (Radar) information
			if (this.config.showRadars != false) {		
			for (var r of this.radars) {

				var warnWrapper = document.createElement("div");
				var icon = document.createElement("div");
				icon.classList.add('trafficicon-camera', 'small-icon');
				var event = document.createElement("div");
				event.className = "event xsmall";
				var information = document.createElement("div");
				information.className = "bold"
				information.innerHTML = r.radar.location;
				var description = document.createElement("div");
				description.className.add = "description xsmall";
				description.innerHTML = r.radar.description;
				var horLine = document.createElement("hr");
				event.appendChild(information);
				event.appendChild(description);
				warnWrapper.appendChild(icon);
				warnWrapper.appendChild(event);
				wrapper.appendChild(warnWrapper);
				wrapper.appendChild(horLine); 
				}
			}

			//Display Traffic Constructions information
			if (this.config.showConstructions != false) {		
			for (var c of this.constructions) {	
				var warnWrapper = document.createElement("div");
				var icon = document.createElement("div");
				icon.classList.add('trafficicon-construction', 'small-icon');
				var event = document.createElement("div");
				event.className = "event xsmall";
				var information = document.createElement("div");
				information.className = "bold"
				information.innerHTML = c.name + " - " + c.construction.startDate + " t/m " + c.construction.stopDate;
				var description = document.createElement("div");
				description.className.add = "description xsmall";
				description.innerHTML = c.construction.description;
				var horLine = document.createElement("hr");
				event.appendChild(information);
				event.appendChild(description);
				warnWrapper.appendChild(icon);
				warnWrapper.appendChild(event);
				wrapper.appendChild(warnWrapper);
				wrapper.appendChild(horLine);
				}
			}
		}			
			
		return wrapper;
	}, // <-- closes the getDom function from above
		
	
	// this processes your data
	processTRAFFIC: function (data) { 
		this.MTR = data; 
    		this.jams=[]
    		this.constructions=[]
    		this.radars=[]
			
		// Convert preferredRoads Array to upper case
		var pRoads = this.config.preferredRoads;
		this.pRoads = pRoads.map(function(x){ return x.toUpperCase() })
    		
		for (var road of this.MTR.roadEntries){
      			Log.log(" typeof="+typeof this.pRoads)
      			if(this.pRoads.includes(road.road) || this.pRoads.includes("ALL")) 
      			{
			
        		for (var j1 of road.events.trafficJams){  
            		Log.log("pushing entry for road="+ road.road)        
            		this.jams.push({name: road.road, jam:j1})
          		}
			
        		for (var construction of road.events.roadWorks){
          		this.constructions.push({name: road.road,construction:construction})
        		}
			
        		for (var radar of road.events.radars){
          		this.radars.push({name: road.road,radar:radar})
        		}
		}
	}
		
//		console.log(this.MTR); // uncomment to see if you're getting data (in dev console)
		this.loaded = true;
	},
	
	// this tells module when to update
	scheduleUpdate: function () { 
		setInterval(() => {
		this.getTRAFFIC();
		}, this.config.updateInterval);
		this.getTRAFFIC();
		var self = this;
	},
	  
	// this asks node_helper for data
	getTRAFFIC: function() { 
		this.sendSocketNotification('GET_MYTRAFFIC', this.url);
	},
	
	// this gets data from node_helper
	socketNotificationReceived: function(notification, payload) { 
		if (notification === "MYTRAFFIC_RESULT") {
		this.processTRAFFIC(payload);
        	this.updateDom(100);
		}
		//this.updateDom(this.config.initialLoadDelay);
	},
});
