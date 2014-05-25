root directory (here) <br>
├── app.js // main entry <br>
├── config // The configuration of my applications (logger, global config, ...) <br>
├── models // The model data (e.g. cassandra model) <br>
├── public // The public directory (client-side code) <br>
├── routes // The route definitions and implementations <br>
├── libs // The standalone services and libraries (Database service, Email service, ...) <br>
└── views // The view rendered by the server to the client (e.g. Handlebars template, ...) <br>
<br>
Each module should be <b>standalone</b>!