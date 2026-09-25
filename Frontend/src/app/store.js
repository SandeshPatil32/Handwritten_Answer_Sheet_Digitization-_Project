import {
  configureStore
} from "@reduxjs/toolkit";
import authReducer
  from "../features/auth/authSlice";

import assignmentReducer
  from "../features/assignments/assignmentSlice";

export const store =
  configureStore({

    reducer: {

      auth: authReducer,

      assignments:
        assignmentReducer
    }
  });