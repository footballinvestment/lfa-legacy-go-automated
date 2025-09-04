declare global {
  interface Window {
    authContext?: {
      state: any;
      login: any;
      register: any;
      logout: any;
      updateUser: any;
      clearError: any;
      refreshStats: any;
    };
  }
}

export {};