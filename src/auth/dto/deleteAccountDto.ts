import { IsNotEmpty, IsEmail } from 'class-validator'

export class DeleteAccountDto{
    @IsNotEmpty()
    readonly  password: string
}