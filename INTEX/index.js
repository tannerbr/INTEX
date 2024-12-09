const express = require("express");
const path = require("path");
const session = require("express-session");

const expressLayouts = require("express-ejs-layouts");

const app = express();
const PORT = process.env.PORT || 5005;

const knex = require("knex") ({
  client : "pg",
  connection : {
    host: process.env.RDS_HOSTNAME || "localhost",
    user: process.env.RDS_USERNAME || "postgres",
    password: process.env.RDS_PASSWORD || "Angol@2337",
    database: process.env.RDS_DB_NAME || "INTEX_DB",
    port: process.env.RDS_PORT || 5432,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,

  }
}); 

// Middleware: Parse incoming requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware: Serve static files
app.use(express.static(path.join(__dirname, 'public')));


// Session setup
app.use(
  session({
    secret: 'password123', // Replace with a strong secret key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false}, // Set to true if using HTTPS
  })
);

// Middleware: Share session data with all views
app.use((req, res, next) => {
  res.locals.user = req.session?.user || null; // Pass user data to views
  res.locals.activePage = ''; // Default activePage
  next();
});

// Set view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware: Use express-ejs-layouts
app.use(expressLayouts);

// Specify default layout file
app.set('layout', 'layouts/base');

// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.session?.user) { // Check if the user session exists
    console.log('logginnng you in')
    return next(); // User is authenticated
  }
  console.log('User not authenticated. Redirecting to login.'); // Debugging log
  res.redirect("/admin/login"); // Redirect if not authenticated
}

/*--------------------------------------*/

// STATIC PAGES BELOW 

/*--------------------------------------*/

app.get("/jenstory", (req, res) => {
  res.render("pages/jenstory", { title: "jenstory", activePage: "jenstory" });
});
app.get("/takeAction", (req, res) => {
  res.render("pages/takeAction", { title: "takeAction", activePage: "takeAction" });
});
app.get("/donate", (req, res) => {
  res.render("pages/donate", { title: "donate", activePage: "donate" });
});
app.get("/sponsors", (req, res) => {
  res.render("pages/sponsors", { title: "sponsors", activePage: "sponsors" });
});
app.get("/ourtech", (req, res) => {
  res.render("pages/ourtech", { title: "our tech", activePage: "ourtech" });
});
app.get("/contactUs", (req, res) => {
  res.render("pages/contactUs", { title: "contactUs", activePage: "contactUs" });
});



// Landing page
app.get("/", (req, res) => {
  res.render("pages/landingpage", { title: "Home", activePage: "home" });
});
app.get("/about", (req, res) => {
  res.render("pages/about", { title: "About Us", activePage: "about" });
});
//volunteer info page
// app.get('/volunteerinfo', (req, res) => {
//   res.render('pages/volunteerinfo', { 
//     title: 'Volunteer Info', 
//     user: req.session?.user || null, // Pass user session info if needed
//   });
// });



/*--------------------------------------*/

// LOGIN PAGES BELOW 

/*--------------------------------------*/




/*--------------------------------------*/


// Start of CRUD Operations! // 



/*--------------------------------------*/


/*--------------------------------------*/

// CRUD Routes for Users

/*--------------------------------------*/


app.get('/admin/manage-users', isAuthenticated, async (req, res) => {
  try {
    const users = await knex('users').select('user_id', 'username');
    console.log('Fetched users:', users);
    res.render('pages/admin/manage-users', { 
      title: 'Manage Admins', 
      users 
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/admin/addUsers", isAuthenticated, async (req, res) => {
  try {
      const users = await knex("users").select('username', 'password'); // Fetch all info
      res.render("pages/admin/addUsers", {
      users,
      title: "Add Admin User",
      activePage: "addUsers" 
    }); //
  } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Error loading adding user");
  }
});

app.post("/admin/addUsers", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    await knex("users").insert({
      username,
      password: hashedPassword, // Store the hashed password
    });

    res.redirect("/admin/manage-users");
  } catch (error) {
    console.error("Error adding User:", error);
    res.status(500).send("Error adding data for User");
  }
});


app.get("/admin/editUsers/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  console.log("Edit user requested for ID:", id)
  try {
    const users = await knex("users")
      .select('user_id', 'username', 'password')
      .where({ user_id: id }) // Ensure proper key is used
      .first();

    if (!users) {
      console.error("No user found for ID:", id); // Debugging
      return res.status(404).send("User not found");
    }

    console.log("Fetched user for edit:", users); // Debugging
    res.render("pages/admin/editUsers", {
      users,
      title: "Edit Admin User",
      activePage: "editUsers",
    });
     } catch (error) {
          console.error(error);
          res.status(500).send("Error fetching data for editing");
      }
  });



  app.post("/admin/editUsers/:id", isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;
  
    console.log("Submitted data:", req.body);
  
    try {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Update user information
      await knex('users')
        .where({ user_id: id })
        .update({ 
          username, 
          password: hashedPassword, // Store the hashed password
        });
  
      res.redirect('/admin/manage-users'); // Redirect back to the user list
    } catch (err) {
      console.error('Error editing user:', err);
      res.status(500).send('Internal Server on app.post Error');
    }
  });

//Deletes User

app.post('/deleteUsers/:id', async (req, res) => {
  const { id } = req.params;
  try {
   
      await knex("users").where({ user_id: id }).del();
      res.redirect("/admin/manage-users");
  } catch (error) {
      console.error(error);
      res.status(500).send("Error deleting data");
  }
});



/*--------------------------------------*/


// Start of CRUD Operations! EVENT REQUESTS // 


/*--------------------------------------*/



app.get("/addEventRequests", isAuthenticated, async (req, res) => {
  try {
      const event = await knex("event_requests").select(
        
        "request_id",
        "num_people", 
        "has_kids", 
        "num_kids", 
        "num_adults", 
        "sewing_preference", 
        "num_sewers", 
        "num_machines", 
        "space_size", 
        "availability_date", 
        "start_time", 
        "duration_hours", 
        "street_address", 
        "city", 
        "state", 
        "zip_code", 
        "contact_first_name", 
        "contact_last_name", 
        "email", 
        "phone", 
        "jen_story",
        "event_status", 
        "event_status",
        "team_member_needed"
  
      
        ); // Fetch all info

        event.has_kids = Boolean(event.has_kids);
        event.has_kids = Boolean(event.jen_story);
      res.render("pages/addEventRequests", {
      event,
      title: "Add Event Request",
      activePage: "addEventRequests" 
    }); //
  } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Error loading adding event REQUEST");
  }
});

app.post("/addEventRequests", async (req, res) => {
  const has_kids =req.body.has_kids ==='true'
  const jen_story =req.body.jen_story ==='true'
  
  const {
    num_people, 
     
    num_kids, 
    num_adults, 
    sewing_preference, 
    num_sewers, 
    num_machines, 
    space_size, 
    availability_date, 
    start_time, 
    duration_hours, 
    street_address, 
    city, 
    state, 
    zip_code, 
    contact_first_name, 
    contact_last_name, 
    email, 
    phone, 
    event_status,
    team_member_needed
  } = req.body; // Extract form inputs

  try {
    const formattedDate = new Date(availability_date).toISOString().split("T")[0];
    // Insert new event into the event_requests table
    await knex("event_requests").insert({
      num_people,
      has_kids,
      num_kids,
      num_adults,
      sewing_preference,
      num_sewers,
      num_machines,
      space_size,
      availability_date: formattedDate,
      start_time,
      duration_hours,
      street_address,
      city,
      state,
      zip_code,
      contact_first_name,
      contact_last_name,
      email,
      phone,
      jen_story,
      event_status,
      team_member_needed
    });

    res.redirect("/"); // Redirect back to home page
  } catch (error) {
    console.error("Error adding Event:", error);
    res.status(500).send("Error adding data for Event Request");
  }
});


/*--------------------------------------*/


// Start of CRUD Operations! EVENTS // 


/*--------------------------------------*/



app.get('/admin/event-manager', isAuthenticated, async (req, res) => {
  try {
    const eventRequests = await knex('event_requests').select(
      "request_id","event_id",
  

     "num_people", 
          "has_kids", 
          "num_kids", 
          "num_adults", 
          "sewing_preference", 
          "num_sewers", 
          "num_machines", 
          "space_size", 
          "availability_date", 
          "start_time", 
          "duration_hours", 
          "street_address", 
          "city", 
          "state", 
          "zip_code", 
          "contact_first_name", 
          "contact_last_name", 
          "email", 
          "phone", 
          "jen_story",
          "event_status",
     "team_member_needed"    
)
.orderBy('availability_date', 'desc')
.orderBy('start_time', 'desc');

    console.log('Fetched users:', eventRequests);
    res.render('pages/admin/event-manager', { 
      title: 'Manage Admins', 
      eventRequests 
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Internal Server Error');
  }
});


app.get("/admin/addEvents", isAuthenticated, async (req, res) => {
  try {
      const event = await knex("event_requests").select(
        
        "request_id",
        "num_people", 
        "has_kids", 
        "num_kids", 
        "num_adults", 
        "sewing_preference", 
        "num_sewers", 
        "num_machines", 
        "space_size", 
        "availability_date", 
        "start_time", 
        "duration_hours", 
        "street_address", 
        "city", 
        "state", 
        "zip_code", 
        "contact_first_name", 
        "contact_last_name", 
        "email", 
        "phone", 
        "jen_story",
        "event_status",
        "team_member_needed"
        
        
        ); // Fetch all info

      
      event.has_kids = Boolean(event.has_kids);
      event.has_kids = Boolean(event.jen_story);

      res.render("pages/admin/addEvents", {
      event,
      title: "Add Admin User",
      activePage: "addEvents" 
    }); //
  } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Error loading adding events");
  }
});

app.post("/admin/addEvents", async (req, res) => {
  const has_kids =req.body.has_kids ==='true'
  const jen_story =req.body.jen_story ==='true'
  const {
    num_people,  
    num_kids, 
    num_adults, 
    sewing_preference, 
    num_sewers, 
    num_machines, 
    space_size, 
    availability_date, 
    start_time, 
    duration_hours, 
    street_address, 
    city, 
    state, 
    zip_code, 
    contact_first_name, 
    contact_last_name, 
    email, 
    phone, 
    event_status,
    team_member_needed
  } = req.body; // Extract form inputs

  try {
    const formattedDate = new Date(availability_date).toISOString().split("T")[0];



    // Insert new event into the event_requests table
    await knex("event_requests").insert({
      num_people,
      has_kids,
      num_kids,
      num_adults,
      sewing_preference,
      num_sewers,
      num_machines,
      space_size,
      availability_date: formattedDate,
      start_time,
      duration_hours,
      street_address,
      city,
      state,
      zip_code,
      contact_first_name,
      contact_last_name,
      email,
      phone,
      jen_story,
      event_status,
     team_member_needed
    });

    res.redirect("/admin/event-manager"); // Redirect back to event manager
  } catch (error) {
    console.error("Error adding Event:", error);
    res.status(500).send("Error adding data for Event");
  }
});


app.get("/admin/editEvents/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  console.log("Edit Event requested for ID:", id)
  try {
    const event = await knex("event_requests")
      .where({ request_id: id }) // Ensure proper key is used
      .first();

    if (!event) {
      console.error("No event found for ID:", id); // Debugging
      return res.status(404).send("event not found");
    }
    
    event.has_kids = Boolean(event.has_kids);
    event.has_kids = Boolean(event.jen_story);

    console.log("Fetched event for edit:", event); // Debugging
    res.render("pages/admin/editEvents", {
      event,
      title: "Edit Admin Events",
      activePage: "editEvents",
    });
     } catch (error) {
          console.error(error);
          res.status(500).send("Error fetching data for event editing");
      }
  });

  app.post("/admin/editEvents/:id", isAuthenticated, async (req, res) => {
    
    const { id } = req.params;
    const has_kids =req.body.has_kids ==='true'
    const jen_story =req.body.jen_story ==='true'
    const { num_people,
      num_kids,
      num_adults,
      sewing_preference,
      num_sewers,
      num_machines,
      space_size,
      availability_date,
      start_time,
      duration_hours,
      street_address,
      city,
      state,
      zip_code,
      contact_first_name,
      contact_last_name,
      email,
      phone,
      event_status,
     team_member_needed
    
    
    
    
    } = req.body;

    

  console.log("Submitted event data:", req.body);

  
    try {
      const formattedDate = new Date(availability_date).toISOString().split("T")[0];


      await knex('event_requests')
        .where({ request_id: id }) // Use `user_id` for clarity
        .update({ 
      num_people,
      has_kids,
      num_kids,
      num_adults,
      sewing_preference,
      num_sewers,
      num_machines,
      space_size,
      availability_date: formattedDate,
      start_time,
      duration_hours,
      street_address,
      city,
      state,
      zip_code,
      contact_first_name,
      contact_last_name,
      email,
      phone,
      jen_story,
      event_status,
      team_member_needed
    
    });
  
      res.redirect('/admin/event-manager'); // Redirect back to the user list
    } catch (err) {
      console.error('Error editing event:', err);
      res.status(500).send('Internal Server  on app.post event Error');
    }
  });


  app.post('/deleteEvents/:id', async (req, res) => {
    const { id } = req.params;
    try {
     
        await knex("event_requests").where({ request_id: id }).del();
        res.redirect("/admin/event-manager");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error deleting data");
    }
  });
  
/*--------------------------------------*/


// Start of CRUD Operations! EVENT SUMMARY // 



/*--------------------------------------*/
// Routes .get pages // VOLUNTEERS



app.get('/admin/recordEvents', isAuthenticated, async (req, res) => {
  try {
    const eventSummary = await knex('event_summary').select(
      "event_id",
      "number_of_items_produced",
      "completed_products",
      "pockets",
      "collars",
      "envelopes",
      "vests",
      "attendance",
      "location_street",
      "location_city",
      "location_state",
      "location_zip"


).orderBy("event_id");

    console.log('Fetched users:', eventSummary);
    res.render('pages/admin/recordEvents', { 
      title: 'Manage Events', 
      eventSummary
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Internal Server Error');
  }
});


app.get("/admin/addRecords", isAuthenticated, async (req, res) => {
  try {
      const eventSummary = await knex("event_summary").select(
        
        "event_id",
        "number_of_items_produced",
        "completed_products",
        "pockets",
        "collars",
        "envelopes",
        "vests",
        "attendance",
        "location_street",
        "location_city",
        "location_state",
        "location_zip"
  

        
        
        ); // Fetch all info
      res.render("pages/admin/addRecords", {
      eventSummary,
      title: "Add Admin User",
      activePage: "addRecords" 
    }); //
  } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Error loading adding events");
  }
});


app.post("/admin/addRecords", async (req, res) => {
  const {
    number_of_items_produced,
    completed_products,
    pockets,
    collars,
    envelopes,
    vests,
    attendance,
    location_street,
    location_city,
    location_state,
    location_zip


  } = req.body; // Extract form inputs

  try {

    // Insert new event into the event_requests table
    await knex("event_summary").insert({
      number_of_items_produced,
      completed_products,
      pockets,
      collars,
      envelopes,
      vests,
      attendance,
      location_street,
      location_city,
      location_state,
      location_zip
    });

    res.redirect("/admin/recordEvents"); // Redirect back to event manager
  } catch (error) {
    console.error("Error adding Event:", error);
    res.status(500).send("Error adding data for Event");
  }
});



app.get("/admin/editRecords/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  console.log("Edit Event requested for ID:", id)
  try {
    const eventSummary = await knex("event_summary")
      .where({ event_id: id }) // Ensure proper key is used
      .first();

    if (!eventSummary) {
      console.error("No event found for ID:", id); // Debugging
      return res.status(404).send("event not found");
    }

    console.log("Fetched event for edit:", eventSummary); // Debugging
    res.render("pages/admin/editRecords", {
      eventSummary,
      title: "Edit Admin Events",
      activePage: "editRecords",
    });
     } catch (error) {
          console.error(error);
          res.status(500).send("Error fetching data for event editing");
      }
  });

  app.post("/admin/editRecords/:id", isAuthenticated, async (req, res) => {
    
    const { id } = req.params;
   
    const {  
      number_of_items_produced,
      completed_products,
      pockets,
      collars,
      envelopes,
      vests,
      attendance,
      location_street,
      location_city,
      location_state,
      location_zip
    
    
    
    
    } = req.body;

    

  console.log("Submitted event data:", req.body);

  
    try {
  
      await knex('event_summary')
        .where({ event_id: id }) // Use `user_id` for clarity
        .update({ 
      
          number_of_items_produced,
          completed_products,
          pockets,
          collars,
          envelopes,
          vests,
          attendance, 
          location_street,
          location_city,
          location_state,
          location_zip
    
    });
  
      res.redirect('/admin/recordEvents'); // Redirect back to the user list
    } catch (err) {
      console.error('Error editing event:', err);
      res.status(500).send('Internal Server  on app.post event Error');
    }
  });


  app.post('/deleteRecords/:id', async (req, res) => {
    const { id } = req.params;
    try {
     
        await knex("event_summary").where({ event_id: id }).del();
        res.redirect("/admin/recordEvents");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error deleting data");
    }
  });

/*--------------------------------------*/


// Start of CRUD Operations! VOLUNTEER-MANAGEMENT // 



/*--------------------------------------*/
// Routes .get pages // VOLUNTEERS

// GET method to list all volunteers
app.get("/admin/volunteer-manager", isAuthenticated, async (req, res) => {
  try {
    // Fetch all volunteers from the database
    const volunteers = await knex("volunteers").select("*");

    // Render the EJS file with the fetched data
    res.render("pages/admin/volunteer-manager", { 
      title: "Volunteer Management", 
      activePage: "volunteer-manager", 
      volunteers 
    });
    
  } catch (err) {
    console.error("Error retrieving volunteers:", err);
    res.status(500).send("Error retrieving volunteers.");
  }
});


// GET method to display addVolunteers form THIS WORKS 


app.get('/addVolunteers', async (req, res) => {
  try {
    res.render("pages/addVolunteers", {
      title: "Add Volunteers",
      activePage: "addVolunteers"
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Error loading add volunteer page");
  }
});

app.post("/addVolunteers", async (req, res) => {
  const {first_name, 
        last_name, 
        email, 
        phone, 
        city, 
        state, 
        zip, 
        opportunity, 
        sewing_level, 
        hours 
       
      } = req.body;
// Get form inputs
  try {

      const existingVolunteer = await knex("volunteers").where({ email }).first();
      if (existingVolunteer) {
        return res.status(400).send("A volunteer with this email already exists.");
      }
      // double checks someone with this email has't already been entered into the database. 
      // updates
      await knex("volunteers").insert({
        first_name, 
        last_name, 
        email, 
        phone, 
        city, 
        state, 
        zip, 
        opportunity, 
        sewing_level, 
        hours,
      });
      res.redirect("/");
      // Add eventually a thank you response 
  } catch (error) {
      console.error("Error adding Volunteer :", error);
      res.status(500).send("Error adding data for Volunteer");
  }
});


app.get("/admin/editVolunteers/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  console.log("Edit Volunteer requested for ID:", id)
  try {
    const volunteer = await knex("volunteers")
      .select("*")
      .where({ id: id }) // Ensure proper key is used
      .first();

    if (!volunteer) {
      console.error("No user found for ID:", id); // Debugging
      return res.status(404).send("User not found");
    }

    console.log("Fetched user for edit:", volunteer); // Debugging
    res.render("pages/admin/editVolunteers", {
      volunteer,
      title: "Edit Admin User",
      activePage: "editVolunteers",
    });
     } catch (error) {
          console.error(error);
          res.status(500).send("Error fetching data for editing");
      }
  });

  app.post("/admin/editVolunteers/:id", isAuthenticated, async (req, res) => {
    const { id } = req.params; // Use the primary key 'id'
    const {
      first_name,
      last_name,
      email,
      phone,
      city,
      state,
      zip,
      opportunity,
      sewing_level,
      hours,
    } = req.body;
  
    console.log("Submitted data for editing:", req.body);
  
    try {
      // Check for duplicate email (excluding the current volunteer)
      
  
     
  
      // Update the volunteer
      await knex("volunteers")
        .where({ id: id })
        .update({
          first_name,
          last_name,
          email,
          phone,
          city,
          state,
          zip,
          opportunity,
          sewing_level,
          hours,
        });
  
      res.redirect("/admin/volunteer-manager"); // Redirect to the volunteer manager
    } catch (err) {
      console.error("Error editing volunteer:", err);
      res.status(500).send("Error editing data for Volunteer");
    }
  });

  app.post('/deleteVolunteer/:id', async (req, res) => {
    const { id } = req.params;
    try {
     
        await knex("volunteers").where({ id: id }).del();
        res.redirect("/admin/volunteer-manager");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error deleting data");
    }
  });


/*--------------------------------------*/


// EVENTUAL GOOGLE LOG IN STUFF // 



/*--------------------------------------*/


// Admin dashboard (protected route)
app.get("/admin/dashboard", isAuthenticated, (req, res) => {
  res.render("pages/admin/dashboard", { title: "Admin Dashboard", activePage: "dashboard" });
});

// Admin login page (GET)

app.get("/admin/login", (req, res) => {
  res.render("pages/adminlogin", { 
    title: "Admin Login", 
    activePage: "login", 
    error: null // Pass null error initially
  });
});

// Admin login page (POST)
// Admin login page (POST)
app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  console.log('Attempting login with username:', username);

  try {
    // Query the users table for the provided username
    const user = await knex('users').where({ username }).first();

    if (user) {
      console.log('User found:', user);

      // Compare submitted password with hashed password in the database
      const validPassword = await bcrypt.compare(password, user.password);

      if (validPassword) {
        console.log('Passwords match! Logging in.');

        // Store user info in the session
        req.session.user = { 
          user_id: user.user_id, 
          username: user.username 
        };

        return res.redirect('/admin/dashboard'); // Redirect to admin dashboard on successful login
      } else {
        console.log('Passwords do not match!');
        return res.render('pages/adminlogin', { 
          title: 'Admin Login', 
          error: 'Invalid username or password', 
          activePage: 'login' 
        });
      }
    } else {
      console.log('No matching username found in the database.');
      return res.render('pages/adminlogin', { 
        title: 'Admin Login', 
        error: 'Invalid username or password', 
        activePage: 'login' 
      });
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).send('Internal Server Error');
  }
});
// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.redirect('/admin/adminlogin');
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.redirect('/'); // Redirect to login page
  });
});

const bcrypt = require("bcrypt");




/*--------------------------------------*/


// Volunteer Search Filter Stuff // 



/*--------------------------------------*/



const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS",
  "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
  "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
  "WI", "WY", "DC"
];

// Route to render the searchVolunteer page with STATES and cities
app.get('/admin/searchVolunteer', isAuthenticated, async (req, res) => {
  try {
    const cities = await knex('volunteers').distinct('city').pluck('city');
    res.render('pages/admin/searchVolunteer', { states: STATES, cities });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).send('Error loading page');
  }
});

// API route to fetch cities based on a selected state
app.get('/admin/api/cities', async (req, res) => {
  const { state } = req.query;

  if (!state) {
    return res.status(400).send('State is required');
  }

  try {
    const cities = await knex('volunteers')
      .where('state', state)
      .distinct('city')
      .pluck('city');
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).send('Error fetching cities');
  }
});

// API route to fetch volunteers based on selected filters
app.get('/admin/api/volunteers', async (req, res) => {
  const { city, state, sewingLevel } = req.query;

  try {
    const query = knex('volunteers').select(
      'first_name',
      'last_name',
      'phone',
      'email',
      'city',
      'state'
    );

    if (state) query.where('state', state);
    if (city) query.where('city', city);
    if (sewingLevel) query.where('sewing_level', sewingLevel);

    console.log(`Query: state=${state}, city=${city}, sewingLevel=${sewingLevel}`); // Debugging

    const volunteers = await query;
    res.json(volunteers);
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    res.status(500).send('Error fetching volunteers');
  }
});



// API route to handle bulk email sending (dummy implementation)
app.post('/admin/api/send-emails', async (req, res) => {
  const { emails } = req.body;

  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).send('No recipients specified');
  }

  try {
    console.log(`Sending emails to: ${emails.join(', ')}`);
    res.send('Emails sent successfully');
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).send('Error sending emails');
  }
});






// 404 handler
app.use((req, res) => {
  res.status(404).render("pages/404", { title: "Page Not Found" });
});

app.listen(PORT, () => {
  console.log(`Turtles Sheltering on port ${PORT}`);
});
