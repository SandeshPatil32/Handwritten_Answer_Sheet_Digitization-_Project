import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

export const uploadAssignment = createAsyncThunk(
  "assignments/uploadAssignment",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/assignments", formData);
      return data.assignment;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Assignment upload failed."
      );
    }
  }
);

export const scanAssignment = createAsyncThunk(
  "assignments/scanAssignment",
  async (assignmentId, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/assignments/${assignmentId}/scan`);
      return data.assignment;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "PDF scanning failed."
      );
    }
  }
);

export const fetchMyAssignments = createAsyncThunk(
  "assignments/fetchMyAssignments",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/assignments/mine");
      return data.assignments;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Could not load your assignments."
      );
    }
  }
);

export const fetchStudentAnalytics = createAsyncThunk(
  "assignments/fetchStudentAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/assignments/mine/analytics");
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Could not load performance analytics."
      );
    }
  }
);

export const fetchTeacherAssignments = createAsyncThunk(
  "assignments/fetchTeacherAssignments",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/assignments/teacher");
      return data.assignments;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Could not load student assignments."
      );
    }
  }
);

export const fetchSimilarityResults = createAsyncThunk(
  "assignments/fetchSimilarityResults",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/assignments/teacher/similarity");
      return data.results || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Could not calculate student similarity."
      );
    }
  }
);

const assignmentSlice = createSlice({
  name: "assignments",
  initialState: {
    items: [],
    similarityResults: [],
    loading: false,
    uploadLoading: false,
    scanLoading: false,
    similarityLoading: false,
    error: null,
    uploadError: null,
    scanError: null,
    similarityError: null,
    analytics: null,
    analyticsLoading: false,
    analyticsError: null
  },
  reducers: {
    clearAssignmentError: (state) => {
      state.error = null;
      state.uploadError = null;
      state.scanError = null;
      state.similarityError = null;
      state.analyticsError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadAssignment.pending, (state) => {
        state.uploadLoading = true;
        state.uploadError = null;
      })
      .addCase(uploadAssignment.fulfilled, (state, action) => {
        state.uploadLoading = false;
        state.items.unshift(action.payload);
      })
      .addCase(uploadAssignment.rejected, (state, action) => {
        state.uploadLoading = false;
        state.uploadError = action.payload;
      })
      .addCase(scanAssignment.pending, (state) => {
        state.scanLoading = true;
        state.scanError = null;
      })
      .addCase(scanAssignment.fulfilled, (state, action) => {
        state.scanLoading = false;
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(scanAssignment.rejected, (state, action) => {
        state.scanLoading = false;
        state.scanError = action.payload;
      })
      .addCase(fetchMyAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMyAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchTeacherAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTeacherAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSimilarityResults.pending, (state) => {
        state.similarityLoading = true;
        state.similarityError = null;
      })
      .addCase(fetchSimilarityResults.fulfilled, (state, action) => {
        state.similarityLoading = false;
        state.similarityResults = action.payload;
      })
      .addCase(fetchSimilarityResults.rejected, (state, action) => {
        state.similarityLoading = false;
        state.similarityError = action.payload;
      })
      .addCase(fetchStudentAnalytics.pending, (state) => {
        state.analyticsLoading = true;
        state.analyticsError = null;
      })
      .addCase(fetchStudentAnalytics.fulfilled, (state, action) => {
        state.analyticsLoading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchStudentAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsError = action.payload;
      });
  }
});

export const { clearAssignmentError } = assignmentSlice.actions;
export default assignmentSlice.reducer;
