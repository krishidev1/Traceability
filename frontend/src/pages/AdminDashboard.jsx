import { useEffect, useState } from "react";
import { FiCheck, FiClock, FiFileText, FiX } from "react-icons/fi";
import { authApi } from "../api/traceabilityApi";
import "../styles/AdminDashboard.css";

export default function AdminDashboard({ toast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadUsers = async () => {
    setLoading(true);
    try {
      setUsers((await authApi.listAdminUsers()).users || []);
    } catch (error) {
      toast(error.message || "Unable to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const viewGiRegistryDocument = async (user) => {
    try {
      const { document, filename } = await authApi.getAdminGiRegistryDocument(user.id);
      const link = window.document.createElement("a");
      link.href = document;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.download = filename;
      link.click();
    } catch (error) {
      toast(error.message || "Unable to open GI Registry document", "error");
    }
  };
  // The first load intentionally synchronizes the queue with the API on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (user, status) => {
    try {
      await authApi.updateAdminUserStatus(user.id, status);
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                verification_status: status,
                is_verified: status === "approved",
              }
            : item,
        ),
      );
      toast(`Profile ${status}`);
    } catch (error) {
      toast(error.message || "Unable to update status", "error");
    }
  };
  const visibleUsers =
    filter === "all"
      ? users
      : users.filter(
          (user) => (user.verification_status || "pending") === filter,
        );

  return (
    <div className="admin-page page-container">
      <section className="admin-hero">
        <div>
          <p className="eyebrow">TRACECONNECT ADMIN</p>
          <h1>Profile verification</h1>
          <p>
            Review submitted grower and supplier profiles before they enter the
            verified network.
          </p>
        </div>
        <div className="admin-count">
          <strong>{users.length}</strong>
          <span>Total profiles</span>
        </div>
      </section>
      <div className="admin-toolbar">
        <div className="admin-tabs">
          {["all", "pending", "approved", "rejected"].map((item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item}{" "}
              <span>
                {item === "all"
                  ? users.length
                  : users.filter(
                      (user) =>
                        (user.verification_status || "pending") === item,
                    ).length}
              </span>
            </button>
          ))}
        </div>
        <button className="btn btn-outline" onClick={loadUsers}>
          Refresh
        </button>
      </div>
      {loading ? (
        <div className="admin-empty">Loading profiles...</div>
      ) : visibleUsers.length === 0 ? (
        <div className="admin-empty">No profiles in this queue.</div>
      ) : (
        <div className="admin-user-grid">
          {visibleUsers.map((user) => {
            const status = user.verification_status || "pending";
            return (
              <article className="admin-user-card" key={user.id}>
                <div className="admin-user-heading">
                  <div className="admin-avatar">
                    {user.profile_image ? (
                      <img src={user.profile_image} alt="" />
                    ) : (
                      (user.name || "U").slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3>{user.name || "Unnamed user"}</h3>
                    <p>
                      {user.account_type || "grower"} · {user.email}
                    </p>
                  </div>
                  <span className={`admin-status ${status}`}>
                    {status === "approved" ? (
                      <FiCheck />
                    ) : status === "rejected" ? (
                      <FiX />
                    ) : (
                      <FiClock />
                    )}
                    {status}
                  </span>
                </div>
                <div className="admin-details">
                  <span>
                    <b>Mobile</b>
                    {user.phone || "—"}
                  </span>
                  <span>
                    <b>Location</b>
                    {user.profile_location ||
                      [user.village_area, user.district, user.state]
                        .filter(Boolean)
                        .join(", ") ||
                      "—"}
                  </span>
                  <span>
                    <b>Documents shared</b>
                    <em>
                      <FiFileText />{" "}
                      {Number(Boolean(user.profile_image)) +
                        Number(Boolean(user.company_logo)) +
                        Number(Boolean(user.has_gi_registry_document))}{" "}
                      file(s)
                    </em>
                  </span>
                  {user.gstin && (
                    <span>
                      <b>GSTIN</b>
                      {user.gstin}
                    </span>
                  )}
                  <span>
                    <b>Contact checks</b>
                    Email {user.email_verified ? "verified" : "pending"} · Mobile{" "}
                    {user.mobile_verified ? "verified" : "pending"} · GST mobile{" "}
                    {user.gst_mobile_verified ? "verified" : "pending"}
                  </span>
                </div>
                <div className="admin-actions">
                  {user.profile_image && (
                    <a
                      href={user.profile_image}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline"
                    >
                      View photo
                    </a>
                  )}
                  {user.company_logo && (
                    <a
                      href={user.company_logo}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline"
                    >
                      View logo
                    </a>
                  )}
                  {user.has_gi_registry_document && (
                    <button
                      className="btn btn-outline"
                      onClick={() => viewGiRegistryDocument(user)}
                      type="button"
                    >
                      View GI Registry PDF
                    </button>
                  )}
                  <button
                    className="btn admin-reject"
                    onClick={() => updateStatus(user, "rejected")}
                  >
                    <FiX /> Reject
                  </button>
                  <button
                    className="btn admin-approve"
                    onClick={() => updateStatus(user, "approved")}
                  >
                    <FiCheck /> Approve
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
