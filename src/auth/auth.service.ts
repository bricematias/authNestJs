import {
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common'
import { SignupDto } from './dto/signupDto'
import * as bcrypt from 'bcrypt'
import * as speakeasy from 'speakeasy'
import { PrismaService } from 'src/prisma/prisma.service'
import { MailerService } from 'src/mailer/mailer.service'
import { SigninDto } from './dto/signinDto'
import { ConfigService, getConfigToken } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { resetPasswordDemandDto } from './dto/resetPasswordDemandDto'
import { ResetPasswordConfirmationDto } from './dto/resetPasswordConfirmationDto'

@Injectable()
export class AuthService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly emailService: MailerService,
        private readonly JwtService: JwtService,
        private readonly configService: ConfigService
    ) {}
    async signup(signupDto: SignupDto) {
        const { email, password, username } = signupDto
        // ** verifier si l'utilisateur est deja inscrit
        const user = await this.prismaService.user.findUnique({
            where: { email },
        })
        if (user) throw new ConflictException('user already exists')
        // ** hasher le mot de passe
        const hash = await bcrypt.hash(password, 10)
        // ** Enregistrer l'utilisateur dans la base de donnée
        await this.prismaService.user.create({
            data: { email, username, password: hash },
        })
        // ** Envoyer un email de confirmation
        await this.emailService.sendSignupConfirmation(email)
        // ** Retourner une réponse de succès
        return { data: 'User succesfully created' }
    }
    async signin(signinDto: SigninDto) {
        const { email, password } = signinDto
        // Verifier si l'utilisateur est deja inscrit
        const user = await this.prismaService.user.findUnique({
            where: { email },
        })
        if (!user) throw new NotFoundException('User not found')
        // Comparerer le mot de passe
        const match = await bcrypt.compare(password, user.password)
        if (!match) throw new UnauthorizedException('Password does not match')
        // Retourner un token jwt
        const payload = {
            sub: user.userId,
            email: user.email,
        }
        const token = this.JwtService.sign(payload, {
            expiresIn: '2h',
            secret: this.configService.get('SECRET_KEY'),
        })
        return {
            token,
            user: {
                username: user.username,
                email: user.email,
            },
        }
    }
    async resetPasswordDemand(resetPasswordDemandDto: resetPasswordDemandDto) {
        const { email } = resetPasswordDemandDto
        const user = await this.prismaService.user.findUnique({
            where: { email },
        })
        if (!user) throw new ConflictException('user not found')
        const code = speakeasy.totp({
            secret: this.configService.get('OTP_CODE'),
            digits: 5,
            step: 60 * 15,
            encoding: 'base32',
        })
        const url = 'http://3000/auth/reset-password-confirmation'
        await this.emailService.sendResetPassword(email, url, code)
        return { data: 'Reset password has been sent' }
    }

    async resetPasswordConfirmation(
        resetPasswordConfirmationDto: ResetPasswordConfirmationDto
    ) {
        const { code, email, password } = resetPasswordConfirmationDto
        const user = await this.prismaService.user.findUnique({
            where: { email },
        })
        if (!user) throw new NotFoundException('User not found')
        const match = speakeasy.totp.verify({
            secret: this.configService.get('OTP_CODE'),
            token: code,
            digits: 5,
            step: 60 * 15,
            encoding: 'base32',
        })

        if (!match) throw new UnauthorizedException('Invalid/expired token')
        const hash = await bcrypt.hash(password, 10)
        await this.prismaService.user.update({
            where: { email },
            data: { password: hash },
        })
        return { data: 'Password updated' }
    }
}
