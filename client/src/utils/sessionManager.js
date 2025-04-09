// Session timeout in milliseconds (30 minutes of inactivity)
const SESSION_TIMEOUT =  30 * 60 * 1000;

export const checkSession = () => {
    const expiry = localStorage.getItem("expiry");
    const lastActivity = localStorage.getItem("lastActivity");
    
    if (!expiry || !lastActivity) {
        return false;
    }

    const now = Date.now();
    const timeSinceLastActivity = now - parseInt(lastActivity);
    
    // Check if session has expired or user has been inactive too long
    if (now > parseInt(expiry) || timeSinceLastActivity > SESSION_TIMEOUT) {
        clearSession();
        return false;
    }

    return true;
};

export const updateLastActivity = () => {
    localStorage.setItem("lastActivity", Date.now().toString());
};

export const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("expiry");
    localStorage.removeItem("lastActivity");
    localStorage.removeItem("role");
    window.location.href = "/";
};

export const extendSession = () => {
    const expiry = Date.now() + 8 * 60 * 60 * 1000; // Extend for another 8 hours
    localStorage.setItem("expiry", expiry.toString());
    updateLastActivity();
}; 