import jwt from "jsonwebtoken";

const secret = "5fbe45e2cb6a4489765606a3648341168f2910b7bf46dd5ac586afdd920b209c"; 
const payload = { data: "sigalagala111" }; 

const token = jwt.sign(payload, secret);
const decoded = jwt.verify(token, secret);



console.log("Token JWT:", token);
console.log("Decoded Token:", decoded);