if (typeof map !== 'undefined') {
	
	//TODO intégrer dans map=
	/*
		layerClusterWri({ // Refuges.info (2 level layer depending on resolution)
			selectorName: 'wri-features,wri-massif', // 2 selectors for one layer
		}),
	*/


	map.addLayer(layerClusterWri({
		selectorName: 'wri-features',
		zIndex: 6,
	}));
	map.addLayer(layerOverpass({
		selectorName: 'osm-features',
		zIndex: 5,
		symbols: {
			hotel: 'City Hall',
			guest_house: 'City Hall',
			chalet: 'City Hall',
			hostel: 'City Hall',
			apartment: 'City Hall',
			alpine_hut: 'Residence',
			cabin: 'Lodge',
			shelter: 'Fishing Hot Spot Facility',
			basic_hut: 'Fishing Hot Spot Facility',
			camp_site: 'Campground',
			drinking_water: 'Drinking Water',
			watering_place: 'Drinking Water',
			fountain: 'Drinking Water',
			water_point: 'Drinking Water',
			spring: 'Drinking Water',
			water_well: 'Drinking Water',
			bus_stop: 'Ground Transportation',
			parking: 'Parking Area',
			restaurant: 'Restaurant',
			shop: 'Shopping Center',
			toilets: 'Restroom',
			internet_access: 'Oil Field',
			telephone: 'Telephone',
		},
	}));
	map.addLayer(layerPyreneesRefuges({
		selectorName: 'prc-features',
		zIndex: 4,
	}));
	map.addLayer(layerC2C({
		selectorName: 'c2c-features',
		zIndex: 3,
	}));
	map.addLayer(layerGeoBB({
		host: '//alpages.info/',
		selectorName: 'alp-features',
		argSelName: 'forums',//TODO obsolete
		attribution: 'Alpages',
		zIndex: 2,
	}));
}

// Resize map
//BEST hauteur max carte quand glisse jquery
if (jQuery.ui)
	$(map.getTargetElement()).resizable({
		handles: 's,w,sw', // 2 côtés et 1 coin

		resize: function(event, ui) {
			ui.position.left = ui.originalPosition.left; // Reste à droite de la page
			map.updateSize(); // Reaffiche tout le nouveau <div>
		},
	});