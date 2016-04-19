// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by aerial-corbel.js.
import { name as packageName } from "meteor/aerial-corbel";

// Write your tests here!
// Here is an example.
Tinytest.add('aerial-corbel - example', function (test) {
  test.equal(packageName, "aerial-corbel");
});
