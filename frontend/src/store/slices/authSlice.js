import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Get user and token from localStorage if they exist
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

// API call helper
const API_URL = 'http://localhost:5000/api/auth';

export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData, thunkAPI) => {
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            if (!response.ok) return thunkAPI.rejectWithValue(data.message);

            // Save to localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            return data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

export const loginUser = createAsyncThunk(
    'auth/login',
    async (userData, thunkAPI) => {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            if (!response.ok) return thunkAPI.rejectWithValue(data.message);

            // Save to localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            return data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);

const initialState = {
    user: user || null,
    token: token || null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: ''
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = false;
            state.message = '';
        },
        logout: (state) => {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            state.user = null;
            state.token = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(registerUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
            })
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
            });
    }
});

export const { reset, logout } = authSlice.actions;
export default authSlice.reducer;
