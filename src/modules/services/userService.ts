import {User} from "../model/user.model";
import httpStatus from 'http-status';


class UserService {


    async buscarUserByEmail(email: string, authUser: User): Promise<any>{
        try{

            return {status: httpStatus.OK,  user: "{ok: ok}"};
        }catch(err: any){
            return {
                status: err.status ? err.status : httpStatus.INTERNAL_SERVER_ERROR ,
                message: err.message
            };
        }

    }



}

export default UserService;

