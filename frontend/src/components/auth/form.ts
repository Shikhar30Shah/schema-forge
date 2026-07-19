
export const initialState = {
  name: '',
  email: '',
  password: '',
};

export const fieldErrors = {
  name: '',
  email: '',
  password: ''
};

export const validation = {
    name: {
        isRequired: true,
        isValidInput: (value: string) => /^[a-zA-Z\s]+$/.test(value),
        IsValidLength: (value: string) => value.length >= 2 && value.length <= 50,
    },
    email: {
        isRequired: true,
        isValidInput: () => true,
        IsValidLength: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length >= 5 && value.length <= 100,
    },
    password: {
        isRequired: true,
        isValidInput: () => true,
        IsValidLength: (value: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(value) && value.length >= 8 && value.length <= 60,
    }
}

export type AuthFormState = typeof initialState;