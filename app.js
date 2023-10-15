//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { name } = require("ejs");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to Todolist App",
});

const item2 = new Item({
  name: "Hit the + button to add new items",
});

const item3 = new Item({
  name: "Click on the cheakbox to delete the item",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length == 0) {
        // that is if length of founditem is zero i.e database is empty then only perform insert operation
        Item.insertMany(defaultItems);
        res.redirect("/");
      } else {
        // if it is not zero then render the items thatt are present in the database
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const addedItem = new Item({
    name: itemName,
  });

  if (listName == "Today") {
    // i.e if item is added in default list then simply add and display
    addedItem.save();
    res.redirect("/");
  } else {
    // if not the default list then find the list and push the added itemName to the array of items in that list
    List.findOne({ name: listName }).then((foundlist) => {
      foundlist.items.push(addedItem);
      foundlist.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkedbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    async function deleteDocuments() {
      try {
        const result = await Item.findByIdAndRemove({ _id: checkedItemId });
        console.log(result);
        // Handle the result
      } catch (error) {
        console.error(error);
        // Handle the error
      }
    }
    res.redirect("/");
    // Usage example
    deleteDocuments();
  } else {
    async function deleteArrayItem() {
      try {
        const updatedDocument = await List.findOneAndUpdate(
          { name: listName },
          { $pull: { items: { _id: checkedItemId } } }
        );
        console.log(updatedDocument);
        console.log("Updated successfully");
      } catch (error) {
        console.log("404");
        console.error(error);
      }
    }
    deleteArrayItem();
    res.redirect("/" + listName);
    // Usage example
  }
});

app.get("/:postName", function (req, res) {
  const requestedUrl = _.capitalize(req.params.postName);

  List.findOne({ name: requestedUrl })
    .then((docs) => {
      if (docs) {
        // List already exists then just render the existing list
        res.render("List", { listTitle: docs.name, newListItems: docs.items });
      } else {
        // Doesnt exist then create a new list with the requestes url
        const customListItem = new List({
          name: requestedUrl,
          items: defaultItems,
        });
        customListItem.save();
        res.redirect("/");
      }
    })
    .catch((error) => {
      console.log(error);
    });

  // res.render("List", { listTitle: name, newListItems: items });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
