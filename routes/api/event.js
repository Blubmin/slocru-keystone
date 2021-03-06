var async = require('async'),
	keystone = require('keystone'),
    restUtils = require('./restUtils'),
	express = require('express'),
	router = express.Router();

var Event = keystone.list("Event");
var model = Event.model;
var Ride = keystone.list("Ride");
var Passenger = keystone.list("Passenger");

router.route('/')
	.get(function(req, res, next) {
		restUtils.list(model, req, res);
	})
	.post(function(req, res, next) {
		restUtils.create(model, req, res);
	});

router.route('/:id')
	.get(function(req, res, next) {
		restUtils.get(model, req, res);
	})
	.patch(function(req, res, next) {
		restUtils.update(model, req, res);
	});

router.route('/search')
	.post(function(req, res, next) {
		restUtils.search(model, req, res);
	});

router.route('/enumValues/:key')
	.get(function(req, res, next) {
		restUtils.enumValues(model, req, res);
	});

router.route('/find')
	.post(function(req, res, next) {
		restUtils.find(model, req, res);
	});

router.route('/:id/ministries')
    .get(function(req, res, next) {
        model.find({_id: req.params.id}).populate('ministries').exec(function(err, event){
            if (err) return res.status(400).send(err);
            return res.json(event.ministries);
        });
    });

router.route('/:id/notifications')
    .get(function(req, res, next) {
        model.find({_id: req.params.id}).populate('notifications').exec(function(err, event){
            if (err) return res.status(400).send(err);
            return res.json(event.notifications);
        });
    });

// used for determining if a user already has a ride for an event
router.route('/:id/:gcm_id') 
    .get(function(req, res, next) {
        Ride.model.findOne({event: req.params.id, gcm_id: req.params.gcm_id}).exec(function (err, ride) {
			if(err) return res.status(400).send(err); 
			if(ride)
                return res.status(200).json({value: 1}); //gcm_id is driving for this event
            
            Ride.model.find({event: req.params.id}).populate('passengers').exec(function(err, rides) {
                console.log(rides);
                // filters out all invalid rides
                rides = rides.filter(function(ride) {
                    var passengers = ride.passengers;
                    console.log(passengers);
                    // Finds passengers where their gcm_id matches
                    passengers = passengers.filter(function(passenger) {
                        console.log(passenger.gcm_id == req.params.gcm_id);
                        return passenger.gcm_id == req.params.gcm_id;
                    });
                    return passengers.length && ride.event == req.params.id;
                });
                if (rides.length)
                    return res.status(200).json({value: 2}); // gcm_id is passenger for event
                return res.status(200).json({value: 0}); // is not a passenger
            });
        });
    });
    
module.exports = router;
