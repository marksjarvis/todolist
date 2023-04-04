//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//MongoDB server

main().catch((err) => console.log(err));

async function main() {

await mongoose.connect(process.env.ATLAS_URL,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
};

/*
mongoose.connect(process.env.ATLAS_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
*/

//create an 'items' SCHEMA
const itemsSchema = new mongoose.Schema({
  name: String
});

//create a MODEL
const Item = new mongoose.model("Item", itemsSchema);

//add some items
const item1 = new Item({
  name: "Welcome to your to do list!"
});

const item2 = new Item({
  name: "Hit the + button to add an item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.>"
});

//array to hold the items
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = new mongoose.model("List", listSchema);

/*
//insert items into database
Item.insertMany(defaultItems)
  .then(function () {
    console.log("Successfully saved all the items to the database");
  })
  .catch(function (err) {
    console.log(err);
  });
*/

app.get("/", function (req, res) {

  //printing all store values in terminal (In my case Hyper Terminal)
  Item.find({})
    .then(foundItem => {
      if (foundItem.length === 0) {
        return Item.insertMany(defaultItems);
      } else {
        return foundItem;
      }
    })
    .then(savedItem => {
      res.render("list", {
        listTitle: "Today",
        newListItems: savedItem
      });
    })
    .catch(err => console.log(err));
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (foundList) {

      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        console.log("saved");
        res.redirect("/" + customListName);
      }
      else {
        //Show an existing list
        //console.log("does not exist");
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(function (err) { });
});

app.post("/", async (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
      name: itemName,
  });

  if (listName === "Today") {
      item.save();
      res.redirect("/");
  } else {

      await List.findOne({ name: listName }).exec().then(foundList => {
          foundList.items.push(item);
          foundList.save();
          res.redirect("/" + listName);
      }).catch(err => {
          console.log(err);
      });
  }
});

// Delete a list item when the checkbox is clicked:
app.post("/delete", function (req, res) {

  //console.log(req.body.checkbox);
  //const checkedItemId = req.body.checkbox;
  // Works with or without .trim()
  const checkedItemId = req.body.checkbox.trim();
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(function (foundItem) { 
        Item.deleteOne({ _id: checkedItemId }) 
      })
      console.log("Successfully deleted checked item");
      res.redirect("/");
  } else {
    List.findOneAndUpdate(
      {name: listName}, 
      {$pull: {items: {_id: checkedItemId}}}
      )
      .then(function (foundList)
        {
          res.redirect("/" + listName);
        });
  }
  

});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server is running on port 3000.");
});
