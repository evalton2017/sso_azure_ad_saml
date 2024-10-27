import LoginController from "../modules/controllers/login-controller";
import {Router} from "express";
import isAuthenticated from "../modules/config/auth/checkToken";

const loginRouter = Router();
const loginController = new LoginController();

loginRouter.route('/login/callback').post(loginController.getAccessToken);
loginRouter.route('/auth-response').post(loginController.authResponse);
//loginRouter.use(isAuthenticated);
export default loginRouter;


