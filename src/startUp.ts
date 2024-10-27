import 'reflect-metadata';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import { json, urlencoded } from 'body-parser';
import { AppLogger } from './util/appLogger';
import compression from 'compression';
import * as cors from 'cors';
import AppError from './shared/errors/AppError';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { Strategy, VerifyWithoutRequest } from '@node-saml/passport-saml';
import { readFileSync } from 'fs';

const samlStrategy = new Strategy({
    callbackUrl: process.env.CALLBACK_URL as string,
    entryPoint:  process.env.ENTRY_POINT,
    issuer: process.env.ISSUER as string,
    decryptionPvk: readFileSync(`./certs/key.pem`, 'utf8'),
    privateKey: readFileSync(`./certs/key.pem`, 'utf8'),
    cert: readFileSync(`./certs/cert_idp.pem`, 'utf8')
  },
  ((profile: any, done) => done(null, profile)) as VerifyWithoutRequest,
  ((profile: any, done) => done(null, profile)) as VerifyWithoutRequest
);

class StartUp {
  public app: express.Application;

  constructor() {
    this.serializable()
    this.deserializeUser()
    console.log(samlStrategy)
    passport.use('samlStrategy', samlStrategy);

    this.app = express();

    this.app.use(cookieParser());
    this.configureMiddleware();

    this.app.use(session({ secret: process.env.SESSION_SECRET as string, resave: false, saveUninitialized: true }));
    this.app.use(passport.initialize({}));
    this.app.use(passport.session());

    this.app.get('/api/login', passport.authenticate('samlStrategy'));

    this.app.post('/api/login/callback',
      passport.authenticate('samlStrategy', { failureRedirect: '/api/login/fail' }),
      function(req, res) {
        res.redirect('/api/auth');
      }
    );

    this.app.get('/api/auth',
      this.ensureAuthenticated,
      function(req, res) {
        res.send(req.user);
      }
    );


    this.app.get('/api/login/fail',
      function(req, res) {
        res.status(401).send('Login failed');
      }
    );

    this.app.route('/metadata').get(function(req: any, res: any) {
      res.type('application/xml');
      res.status(200);
      res.send(
        samlStrategy.generateServiceProviderMetadata(
          readFileSync('./certs/cert.pem', 'utf8'),
          readFileSync('./certs/cert.pem', 'utf8')
        )
      );
    });

    this.app.use((error: Error, request: Request, response: Response, next: NextFunction)=>{
      console.log(error)
      if(error instanceof AppError){
        return response.status(error.statusCode).json({
          status: 'error',
          message: error.message
        })
      }
      return response.status(500).json({
        status: 'error',
        message: error.message
      })
    });

  }

  private configureMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(json({ limit: '50mb' }));
    this.app.use(compression());
    this.app.use(urlencoded({ limit: '50mb', extended: true }));
    this.enableCors();
    AppLogger.configureLogger();
  }

  enableCors() {
    const options: cors.CorsOptions = {
      methods: "GET,OPTIONS,PUT,POST,DELETE",
      origin: "*",
    }
    this.app.use(cors.default(options));
  }

  ensureAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated())
      return next();
    else
      return res.redirect('/api/login');
  }

  serializable(){
    passport.serializeUser(function(user: any, done: any) {
      console.log(`serialize user`, user);
      done(null, user);
    });
  }

  deserializeUser(){
    passport.deserializeUser(function(user: any, done: any) {
      console.log(`deserializeUser user`, user);
      done(null, user);
    });
  }


}

export default new StartUp();
