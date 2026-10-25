
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const packageDefinition = protoLoader.loadSync("../user.proto", {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition).user;

const client = new proto.UserService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

client.GetUserProfile({ user_id: 1 }, (err, response) => {
  if (err) {
    console.error("Gagal:", err.message);
    return;
  }

  console.log("Nama  :", response.name);
  console.log("Email :", response.email);
});
