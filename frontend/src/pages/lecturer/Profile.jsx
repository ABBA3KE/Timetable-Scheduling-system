import { useState } from "react";
import { Save, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";

export default function LecturerProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || "", phone: user?.phone || "",
    officeLocation: user?.officeLocation || "", officeHours: user?.officeHours || "",
  });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", form);
      updateUser(data.user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setChangingPw(true);
    try {
      await api.put("/auth/change-password", pwForm);
      toast.success("Password changed successfully");
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Keep your contact details and office information current so students and admins can reach you.
        </p>
      </div>

      <Card>
        <h3 className="mb-4 font-semibold">Contact & Office Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Full Name</label>
            <input className="input-field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Phone Number</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Office Location</label>
            <input className="input-field" value={form.officeLocation} onChange={(e) => setForm({ ...form, officeLocation: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Office Hours</label>
            <input className="input-field" value={form.officeHours} onChange={(e) => setForm({ ...form, officeHours: e.target.value })} placeholder="e.g. Mon & Wed, 2pm - 4pm" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button icon={Save} loading={saving} onClick={handleSave}>Save Changes</Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Change Password</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Current Password</label>
            <input type="password" className="input-field" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">New Password</label>
            <input type="password" className="input-field" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button icon={KeyRound} loading={changingPw} onClick={handleChangePassword}>Update Password</Button>
        </div>
      </Card>
    </div>
  );
}
