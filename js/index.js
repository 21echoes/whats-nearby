var gameState = {
  userLocation: {},
  manuallySetLocation: false,

  NUM_IMAGES: 5,
  imageLocations: [],
  closestImageIndex: null,

  browserLocationUpdateToken: null,

  hasUserLocation: function() {
    return Object.keys(this.userLocation).length !== 0;
  },

  setUserLocation: function(lat, lon) {
    var previouslyUnset = !this.hasUserLocation();
    this.userLocation.lat = lat;
    this.userLocation.lon = lon;
    // with a framework, we'd have a binding do this part automatically...
    gameView.renderUserLocationImage();
    if (previouslyUnset) {
      newRound();
    } else {
      this.determineClosestImage();
    }
  },

  getRandomLocation: function() {
    // rough bounding box of the bulk of earth's land mass, so the user isn't over the ocean so much
    // lat: (-40...70), lon: (-125...-35) or (-10...150)
    var lat = (Math.random() * 110) - 40; // if we want the whole earth: (Math.random() * 180) - 90;
    var lon = Math.random() < 0.5 ? (Math.random() * 90) - 125 : (Math.random() * 160) - 10; // if we want the whole earth: (Math.random() * 360) - 180;
    return { 'lat': lat, 'lon': lon };
  },

  randomizeCandidateImageLocations: function() {
    gameState.imageLocations.length = 0;
    for (var i = 0; i < this.NUM_IMAGES; i++) {
      gameState.imageLocations.push(this.getRandomLocation());
    }

    // figure out which one's the winner now that we've made them
    this.determineClosestImage();
  },

  determineClosestImage: function() {
    function distanceFromLocation(coords) {
      return Math.sqrt(Math.pow(gameState.userLocation.lat - coords.lat, 2) + Math.pow(gameState.userLocation.lon - coords.lon, 2));
    }

    // underscore.js's min function would be nice here..
    var shortestDistance = Number.MAX_VALUE;
    for (var i = 0; i < gameState.imageLocations.length; i++) {
      var coords = gameState.imageLocations[i];
      var distance = distanceFromLocation(coords);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        gameState.closestImageIndex = i;
      }
    }
  }
};

var userLocationInput = {
  setupForBrowserGeolocationAPI: function() {
    // show instructions appropriate to the browser's capabilities
    document.getElementById('geolocation-api-prompt').style.display = navigator.geolocation ? 'block' : 'none';
    document.getElementById('no-geolocation-api-prompt').style.display = navigator.geolocation ? 'none' : 'block';

    // don't try to bind to the browser's geolocation api if it doesn't have it
    if (!navigator.geolocation) {
      return;
    }

    var geoOptions = {
       timeout: 10 * 1000
    }

    function geoSuccess(position) {
      // ignore browser geolocation updates if the user has manually entered their own location
      if (!gameState.manuallySetLocation) {
        gameState.setUserLocation(position.coords.latitude, position.coords.longitude);
      }
    }

    function geoError(error) {
      console.log('GEO ERROR', error);
      // TODO: handle no position info
    }

    document.getElementById('geolocation-api-button').onclick = function() {
      // if they hit "use GPS", don't listen to their manual entry
      gameState.manuallySetLocation = false;
      // bind to the browser's geolocation API, including listening for updates
      navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
      gameState.browserLocationUpdateToken = navigator.geolocation.watchPosition(geoSuccess, geoError, geoOptions);
    };
  },

  setupManualLocationEntry: function() {
    // for turning user location entry into GPS coordinates
    var geocoder = new google.maps.Geocoder();

    function geocodeForUserInput(e) {
      // ignore default form submit handling
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.returnValue = false;

      var manualLocationInput = document.getElementById('manual-location-input');
      geocoder.geocode( { 'address': manualLocationInput.value },
        function(results, status) {
          // if successful & with results, use the first result & ignore the browser's geolocation API
          if (status == google.maps.GeocoderStatus.OK && results.length > 0) {
            gameState.manuallySetLocation = true;
            if (gameState.browserLocationUpdateToken !== null) {
              navigator.geolocation.clearWatch(gameState.browserLocationUpdateToken);
              gameState.browserLocationUpdateToken = null;
            }

            gameState.setUserLocation(results[0].geometry.location.lat(), results[0].geometry.location.lng());
          } else {
            // TODO: handle no search results
          }
        });
    }

    document.getElementById('manual-location-submit').addEventListener('click', geocodeForUserInput, false);
    document.getElementById('manual-location-form').addEventListener('submit', geocodeForUserInput, false);
  },

  setup: function() {
    this.setupForBrowserGeolocationAPI();
    this.setupManualLocationEntry();
  }
};

var gameView = {
  renderCandidateImages: function() {
    function makeClickHandler(index) {
      return function() {
        this.onClickSatelliteImage(index);
      };
    }

    this.showCandidateImages();

    var imgList = document.getElementById("candidate-sat-images-list");
    for (var i = 0; i < gameState.imageLocations.length; i++) {
      var coords = gameState.imageLocations[i];
      var img = this.makeSatelliteImage(coords);
      var li = document.createElement('li');
      li.id = this.idForIndex(i);
      li.appendChild(img);
      li.onclick = makeClickHandler(i).bind(this);
      if (imgList.childNodes && imgList.childNodes.length > i) {
        imgList.replaceChild(li, imgList.childNodes[i]);
      } else {
        imgList.appendChild(li);
      }
    }
  },

  onClickSatelliteImage: function(index) {
    var billboard = document.getElementById("billboard");

    // use whether or not the billboard is showing status messages as a proxy for whether or not the round is over
    var roundOver = billboard.style.display !== 'none';
    // ignore further user input if the round is over
    if (roundOver) {
      return;
    }

    // make sure we're ready for user input
    if (!gameState.closestImageIndex) {
      gameState.determineClosestImage();
    }

    // set up & show status messaging
    var result = document.getElementById("result");
    var isClosest = (index === gameState.closestImageIndex);
    if (isClosest) {
      document.getElementById(this.idForIndex(index)).className += ' user-correct';
      billboard.className = 'correct';
      result.innerHTML = 'Correct!';
    } else {
      document.getElementById(this.idForIndex(gameState.closestImageIndex)).className += ' real-closest';
      document.getElementById(this.idForIndex(index)).className += ' user-incorrect';
      billboard.className = 'incorrect';
      result.innerHTML = "Sorry, that's incorrect.";
    }
    billboard.style.display = 'inline-block';
  },

  renderUserLocationImage: function() {
    document.getElementById('user-location-status').style.display = gameState.hasUserLocation() ? 'block' : 'none';
    if (gameState.hasUserLocation()) {
      document.getElementById('user-location-sat-image').src = this.getImageSrcForCoords(gameState.userLocation);
    }
  },

  getImageSrcForCoords: function(coords) {
    return "http://maps.googleapis.com/maps/api/staticmap?center=" +
      coords.lat + "," + coords.lon +
      "&zoom=4&size=300x300&sensor=false&maptype=satellite";
  },

  makeSatelliteImage: function(coords) {
    var img = new Image();
    img.src = this.getImageSrcForCoords(coords);
    return img;
  },

  idForIndex: function(index) {
    return 'image-' + index;
  },

  indexForID: function(id) {
    return parseInt(id.replace('image-',''), 10);
  },

  showCandidateImages: function() {
    document.getElementById("candidate-sat-images-section").style.display = 'block';
  },

  hideBillboard: function() {
    document.getElementById("billboard").style.display = 'none';
  }
}

function newRound() {
  gameState.randomizeCandidateImageLocations();
  gameView.hideBillboard();
  gameView.renderCandidateImages();
}

userLocationInput.setup();
gameView.hideBillboard();
document.getElementById('play-again-button').onclick = newRound;
// newRound also gets called as soon as user provides a location
