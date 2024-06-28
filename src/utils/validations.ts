export const EMAIL_REGEX = /^[\w+-]+(\.[\w-]+)*@[\dA-Za-z-]+(\.[\dA-Za-z]+)*(\.[A-Za-z]{2,})$/

export const isValidEmail = (email: string) => EMAIL_REGEX.test(email)
