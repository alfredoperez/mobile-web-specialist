import idb from 'idb';
// Every update to db requires  a newer version number and 
// case statment
var dbPromise = idb.open('test-db', 4, (upgradeDb) => {
  switch (upgradeDb.oldVersion) {
    case 0:
      var keyValStore = upgradeDb.createObjectStore('keyval');
      keyValStore.put('world', 'hello');
    case 1:
      // create other object store
      upgradeDb.createObjectStore('people', {
        keyPath: 'name'
      });
    case 2:
      var peopleStore = upgradeDb.transaction.objectStore('people');
      peopleStore.createIndex('animal', 'favoriteAnimal');
    case 3:
      var peopleStore = upgradeDb.transaction.objectStore('people');
      peopleStore.createIndex('age', 'age');
  }
});

// Read
dbPromise.then((db) => {
  var tx = db.transaction('keyval');
  var keyValStore = tx.objectStore('keyval');

  return keyValStore.get('hello');
}).then((val) => {
  console.log(' the value of hello is ', val);
});

// update
dbPromise.then((db) => {
  var tx = db.transaction('keyval', 'readwrite');
  var keyValStore = tx.objectStore('keyval');
  keyValStore.put('bar', 'foo');

  return tx.complete
}).then((val) => {
  console.log('Added foo:bar to keval');
});
// Adding the favorite animal quiz
dbPromise.then((db) => {
  var tx = db.transaction('keyval', 'readwrite');
  var keyValStore = tx.objectStore('keyval');
  keyValStore.put('Velociraptor', 'favoriteAnimal');

  return tx.complete
}).then((val) => {
  console.log('Added FavoriteAnimal:Velociraptor to keyval');
});

dbPromise.then((db) => {
  var tx = db.transaction('people', 'readwrite');
  var peopleStore = tx.objectStore('people');

  peopleStore.put({
    name: 'Sam Munoz',
    age: 25,
    favoriteAnimal: 'dog'
  });

  peopleStore.put({
    name: 'Susan Keller',
    age: 34,
    favoriteAnimal: 'cat'
  });

  peopleStore.put({
    name: 'Lillie Wolfe',
    age: 28,
    favoriteAnimal: 'dog'
  });

  peopleStore.put({
    name: 'Marc Stone',
    age: 39,
    favoriteAnimal: 'cat'
  });


  return tx.complete
}).then((val) => {
  console.log('Added Sam Munoz to people');
});

// Read all the people
dbPromise.then((db) => {
  var tx = db.transaction('people');
  var peopleStore = tx.objectStore('people');

  // Getting by index. this will sort out the people
  // by the animal
  var animalIndex = peopleStore.index('animal')


  // Get only the one with the specified animal
  return animalIndex.getAll('cat');
}).then((people) => {
  console.log('People: ', people);
});

// Read all the people
dbPromise.then((db) => {
  var tx = db.transaction('people');
  var peopleStore = tx.objectStore('people');

  // Getting by age index. this will sort out the people
  // by the age
  var ageIndex = peopleStore.index('age')

  // Get only the one with the specified animal

  return ageIndex.getAll();
}).then((people) => {
  console.log('People By Age: ', people);
});

// Using cursors
dbPromise.then(function (db) {
  var tx = db.transaction('people');
  var peopleStore = tx.objectStore('people');
  var ageIndex = peopleStore.index('age');

  return ageIndex.openCursor();
}).then(function (cursor) {
  // This will skip the two first items
  if (!cursor) return;
  return cursor.advance(2);
}).then(function logPerson(cursor) {
  if (!cursor) return;
  console.log("Cursored at:", cursor.value.name);
  // I could also do things like:
  // cursor.update(newValue) to change the value, or
  // cursor.delete() to delete this entry
  return cursor.continue().then(logPerson);
}).then(function () {
  console.log('Done cursoring');
});