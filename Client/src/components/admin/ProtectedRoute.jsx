import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react";

const ProtectedRoute = ({ children, allowedRoles = ["recruiter"] }) => {
    const { user } = useSelector(store => store.auth);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate("/login");
        } else if (!allowedRoles.includes(user.role)) {
            navigate("/");
        }
    }, [user, navigate]);

    if (!user || !allowedRoles.includes(user.role)) {
        return null;
    }

    return children;
};

export default ProtectedRoute;