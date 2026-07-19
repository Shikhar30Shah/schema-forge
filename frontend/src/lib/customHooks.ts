import { useState } from "react";

export const customHooks = (initialState: any, fieldErrors: any, validation: any) => {

    const [states, setStates] = useState(initialState);
    const [errors, setErrors] = useState(fieldErrors);

    const updateState = (name: string, value: any) => {
        setStates((prevState: any) => ({
            ...prevState,
            [name]: value
        }));
    }

    const updateError = (name: string, value: any) => {
        setErrors((prevState: any) => ({
            ...prevState,
            [name]: value
        }));
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if(validation[name].isValidInput(value)){
            setStates((prevState: any) => ({
                ...prevState,
                [name]: value
            }));
            updateError(name, '');
            updateError('auth', '');
        }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if(validation[name].isRequired && !value){
            updateError(name, `${name} is required`);
        }
        else if(!validation[name].IsValidLength(value)){
            updateError(name, `Invalid ${name}`);
        }
    }

    const resetStates = () => {
        setStates(initialState);
    }

    const resetErrors = () => {
        setErrors(fieldErrors);
    }

    const setData = (data: any) => {
        setStates((prevState: any) => ({
            ...prevState,
            ...data
        }));
    }

    const isError = () => {
        for (const key in errors) {
            if (errors[key]) {
                return true;
            }
        }
        return false;
    }

    const isEmpty = () => {
        for (const key in states) {
            if (!states[key] && validation[key].isRequired) {
                return true;
            }
        }
        return false;
    }

    return {
        states,
        setStates,
        errors,
        setErrors,
        updateState,
        updateError,
        handleChange,
        handleBlur,
        resetStates,
        resetErrors,
        setData,
        isError,
        isEmpty
    }
}