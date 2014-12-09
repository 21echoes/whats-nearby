#### Prompt

The task was to create a simple game that asks users to identify which of several images was taken closest to their current location.

When the user loads the game, they should be presented with 5 images to choose from.  Each of the images will have location information associated with it that should not be (easily) visible to the user.  Your game will prompt the user to select the image of an area closest to their location.  When a user selects an image, they should be notified whether their selection is indeed the closest image.  If they do not select the closest image, they should be notified which image is closest.  After selecting an image, the user should be asked if they want to play again.  When the user plays the game again, they should be presented with a new set of images.

#### Research & MVP HTML: 15 minutes
  * Writing basic HTML while thinking of game architecture
  * Barebones HTML 5 template with prompt sections (instructions, notifications) at the top with image list below
  * Small enough project to avoid any real need for factoring, so sticking with one js file and one css file

#### MVP Javascript: 1 hour
  * Game state object
  * Binding to browser geolocation API
  * Setting up game board with images from the google maps static maps API
  * Binding click events from game board to click handling
  * Calculating success or failure, notifying the user, and prompting for another game

#### Extra functionality (Geocoding): 30 minutes
  * Add __Google Maps API v3__ js import and address input form to html
  * Override form submission with js handling that sets resulting location and unbinds browser geolocation updates

#### Styling: 45 minutes
  * Different color boxes depending on user selection
  * Centering, fitting images
  * Wishing I had Sass or LESS

#### Clean-up: 30 minutes
  * Refactoring javascript
  * Adding comments where helpful

## Total: 3 hours