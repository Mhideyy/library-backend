import jwt from "jsonwebtoken";

const verifyAttendant = (req, res, next) => {
  try {
    const token = req.cookies.attendant_token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.attendant = decoded;

    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

export default verifyAttendant;
