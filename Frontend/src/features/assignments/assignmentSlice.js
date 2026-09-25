import {
  createAsyncThunk,
  createSlice
} from "@reduxjs/toolkit";

import api from "../../services/api";


// ======================================
// UPLOAD ASSIGNMENT
// ======================================

export const uploadAssignment =
  createAsyncThunk(
    "assignments/uploadAssignment",

    async (
      formData,
      { rejectWithValue }
    ) => {

      try {

        const { data } =
          await api.post(
            "/assignments",
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data"
              }
            }
          );

        return data.assignment;

      } catch (error) {

        return rejectWithValue(
          error.response?.data?.message ||
          "Assignment upload failed."
        );
      }
    }
  );


// ======================================
// STUDENT ASSIGNMENTS
// ======================================

export const fetchMyAssignments =
  createAsyncThunk(
    "assignments/fetchMyAssignments",

    async (
      _,
      { rejectWithValue }
    ) => {

      try {

        const { data } =
          await api.get(
            "/assignments/mine"
          );

        return data.assignments;

      } catch (error) {

        return rejectWithValue(
          error.response?.data?.message ||
          "Could not load your assignments."
        );
      }
    }
  );


// ======================================
// TEACHER ASSIGNMENTS
// ======================================

export const fetchTeacherAssignments =
  createAsyncThunk(
    "assignments/fetchTeacherAssignments",

    async (
      _,
      { rejectWithValue }
    ) => {

      try {

        const { data } =
          await api.get(
            "/assignments/teacher"
          );

        return data.assignments;

      } catch (error) {

        return rejectWithValue(
          error.response?.data?.message ||
          "Could not load student assignments."
        );
      }
    }
  );


// ======================================
// SLICE
// ======================================

const assignmentSlice =
  createSlice({

    name: "assignments",

    initialState: {
      items: [],

      loading: false,

      uploadLoading: false,

      error: null,

      uploadError: null
    },


    reducers: {

      clearAssignmentError:
        (state) => {

          state.error = null;

          state.uploadError = null;
        }
    },


    extraReducers:
      (builder) => {

        builder

          // ==========================
          // UPLOAD
          // ==========================

          .addCase(
            uploadAssignment.pending,
            (state) => {

              state.uploadLoading =
                true;

              state.uploadError =
                null;
            }
          )

          .addCase(
            uploadAssignment.fulfilled,
            (state, action) => {

              state.uploadLoading =
                false;

              state.items.unshift(
                action.payload
              );
            }
          )

          .addCase(
            uploadAssignment.rejected,
            (state, action) => {

              state.uploadLoading =
                false;

              state.uploadError =
                action.payload;
            }
          )


          // ==========================
          // STUDENT FETCH
          // ==========================

          .addCase(
            fetchMyAssignments.pending,
            (state) => {

              state.loading = true;

              state.error = null;
            }
          )

          .addCase(
            fetchMyAssignments.fulfilled,
            (state, action) => {

              state.loading = false;

              state.items =
                action.payload;
            }
          )

          .addCase(
            fetchMyAssignments.rejected,
            (state, action) => {

              state.loading = false;

              state.error =
                action.payload;
            }
          )


          // ==========================
          // TEACHER FETCH
          // ==========================

          .addCase(
            fetchTeacherAssignments.pending,
            (state) => {

              state.loading = true;

              state.error = null;
            }
          )

          .addCase(
            fetchTeacherAssignments.fulfilled,
            (state, action) => {

              state.loading = false;

              state.items =
                action.payload;
            }
          )

          .addCase(
            fetchTeacherAssignments.rejected,
            (state, action) => {

              state.loading = false;

              state.error =
                action.payload;
            }
          );
      }
  });


export const {
  clearAssignmentError
} = assignmentSlice.actions;


export default assignmentSlice.reducer;