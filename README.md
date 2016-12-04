# artusi_solver
Simple brute force solver for the "Final Touch" step of the iOS game "Artusi Cooking Time"

Ok, that's it:
a simple exercise to solvea Bejewled-like situation in an italian iOS game called Artusi: Cooking time.

With just one swap you have to collect as many ingredients as possible in a well defined setup.

The project is made up of 3 parts:
#. a solver: reads a text matrix of 8x8 chars, each char is an item, and one char is the ingredient to collect. Spaces are empty slot
#. a scanner: it uses openCV (3.1.0) to scan a snapshot of the game automatically and generate a matrix for step 1
#. a simple Tornado web server that offers a JSON API: input: a file, output a file with the solution superimposed

The scanner and the solver can be used from the command line and contains minimal help.

At the moment the image is tailored o an iPhone 5c screen size, so 640x1136 pixels.


