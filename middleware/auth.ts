import {auth} from  "express-oauth2-jwt-bearer/dist/index.js";


if (!process.env.AUTH0_AUDIENCE) {
    throw new Error("Missing AUTH0_AUDIENCE in environment variables.");
}
if (!process.env.AUTH0_ISSUER_BASE_URL) {
    throw new Error("Missing AUTH0_ISSUER_BASE_URL in environment variables.");
}
const verifyAuth0Token = auth ({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: "RS256"
});

export { verifyAuth0Token };