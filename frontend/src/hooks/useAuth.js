// Week 2: will handle login state, role detection, token refresh
function useAuth() {
  return {
    user: null,
    role: null,
    isAuthenticated: false,
  }
}

export default useAuth