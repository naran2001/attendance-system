import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'attendance_management_secure_secret_777';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key);
}

export async function decrypt(token: string): Promise<any> {
    const { payload } = await jwtVerify(token, key, {
        algorithms: ['HS256'],
    });
    return payload;
}
