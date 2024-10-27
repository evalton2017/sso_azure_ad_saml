import { Request, Response } from 'express';
import { User } from '../model/user.model';
import UserService from '../services/userService';
import passport from 'passport';
import session from 'express-session';

export default class LoginController {


  async getAccessToken(req: Request, res: Response): Promise<Response> {
      passport.authenticate('samlStrategy');
      console.log(req.isAuthenticated())
      console.log(JSON.stringify(req.session))
      return res.status(200).json("ok");

  }

  async authResponse(req: Request, res: Response): Promise<Response> {
    console.log(req.body)
    return res.status(200).json(req.body);

  }

}

//export default LoginController;
