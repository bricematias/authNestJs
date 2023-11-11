import { IsEmail } from 'class-validator'
export class resetPasswordDemandDto {
    @IsEmail()
    readonly email: string
}
