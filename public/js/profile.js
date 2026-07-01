document.addEventListener("DOMContentLoaded", () => {
    loadProfile();
    loadAddresses();
});

async function loadProfile() {

    try {

        const res = await fetch("/auth/current");
        const data = await res.json();

        if (!data.loggedIn) {
            window.location.href = "/login";
            return;
        }

        const user = data.user;

        document.getElementById("profileUsername").textContent = user.username;
        document.getElementById("profileRole").textContent = user.role;
        document.getElementById("username").value = user.username;
        document.getElementById("email").value = user.email || "";
        document.getElementById("phone").value = user.phone || "";
        document.getElementById("role").value = user.role;

        if (user.avatar) {
            document.getElementById("profileImage").src = user.avatar;
        }

        // Show role-specific section
        if (user.role.toLowerCase() === "vendor") {

            document.querySelector(".buyer-section").style.display = "none";

        } else {

            document.querySelector(".vendor-section").style.display = "none";

        }

    } catch (err) {

        console.error(err);
        window.location.href = "/login";

    }

}

const avatarModal = document.getElementById("avatarModal");

document
.getElementById("changePhotoBtn")
.addEventListener("click",()=>{

    avatarModal.classList.add("show");

});

document
.getElementById("cancelAvatarBtn")
.addEventListener("click",()=>{

    avatarModal.classList.remove("show");

});

document
.getElementById("uploadAvatarBtn")
.addEventListener("click",uploadAvatar);

async function uploadAvatar(){

    const input=document.getElementById("avatarInput");

    if(input.files.length===0){

        alert("Please choose an image.");
        return;

    }

    const formData=new FormData();

    formData.append("avatar",input.files[0]);

    const res=await fetch("/auth/upload-avatar",{

        method:"POST",

        body:formData

    });

    const data=await res.json();

    if(data.success){

        document.getElementById("profileImage").src=
            data.avatar+"?"+Date.now();

        avatarModal.classList.remove("show");

    }else{

        alert(data.message);

    }

}

document
.getElementById("saveChangesBtn")
.addEventListener("click", saveProfile);

async function saveProfile() {
    const usernameVal = document.getElementById("username").value.trim();
    const emailVal = document.getElementById("email").value.trim();
    const phoneVal = document.getElementById("phone").value.trim();


    if (!usernameVal) {
        alert("Username cannot be empty");
        return;
    }

    if (!emailVal) {
        alert("Email cannot be empty");
        return;
    }

    const body = {
        username: usernameVal,
        email: emailVal,
        phone: phoneVal || null
    };

    try {

        const res = await fetch("/auth/profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.success) {
            alert("Profile updated!");

            // refresh UI
            loadProfile();
        } else {
            alert(data.message);
        }

    } catch (err) {
        console.error(err);
        alert("Update failed");
    }
}

document
.getElementById("changePasswordBtn")
.addEventListener("click", changePassword);

async function changePassword() {

    const current = document.getElementById("currentPassword").value;
    const newPass = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmPassword").value;

    // ❗ validation
    if (!current || !newPass || !confirm) {
        alert("All fields are required");
        return;
    }

    if (newPass !== confirm) {
        alert("New passwords do not match");
        return;
    }

    if (newPass.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }

    try {

        const res = await fetch("/auth/change-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                currentPassword: current,
                newPassword: newPass
            })
        });

        const data = await res.json();

        if (data.success) {
            alert("Password changed successfully");

            // clear fields
            currentPassword.value = "";
            newPassword.value = "";
            confirmPassword.value = "";

        } else {
            alert(data.message);
        }

    } catch (err) {
        console.error(err);
        alert("Error changing password");
    }
}

async function loadAddresses() {

    const res = await fetch("/auth/addresses");
    const data = await res.json();

    const container = document.getElementById("addressList");
    container.innerHTML = "";

    data.forEach(addr => {

        const div = document.createElement("div");
        div.className = "address-item";

        div.innerHTML = `
            <span>${addr.address}</span>
            <button onclick="deleteAddress(${addr.id})">Delete</button>
        `;

        container.appendChild(div);

    });
}

document.getElementById("addAddressBtn").addEventListener("click", async () => {

    const address = document.getElementById("newAddress").value.trim();

    if (!address) {
        alert("Address cannot be empty");
        return;
    }

    const res = await fetch("/auth/addresses", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ address })
    });

    const data = await res.json();

    if (data.success) {
        document.getElementById("newAddress").value = "";
        loadAddresses();
    } else {
        alert(data.message);
    }

});

async function deleteAddress(id) {

    const res = await fetch(`/auth/addresses/${id}`, {
        method: "DELETE"
    });

    const data = await res.json();

    if (data.success) {
        loadAddresses();
    } else {
        alert(data.message);
    }

}

async function loadVendorProfile() {

    const res = await fetch("/auth/vendor-profile");
    const data = await res.json();

    if (!data.success) return;

    document.getElementById("storeName").value =
        data.vendor.store_name || "";

    document.getElementById("businessRegNo").value =
        data.vendor.business_registration_no || "";

    document.getElementById("storeAddress").value =
        data.vendor.address || "";

    document.getElementById("storeDescription").value =
        data.vendor.description || "";
}

document.addEventListener("click", async (e) => {

    const btn = e.target.closest("#saveStoreBtn");

    if (!btn) return;

    const storeName = document.getElementById("storeName")?.value;
    const businessRegNo = document.getElementById("businessRegNo")?.value;
    const address = document.getElementById("storeAddress")?.value;
    const description = document.getElementById("storeDescription")?.value;

    if (!storeName || !businessRegNo || !address) {
        alert("Please fill in required fields");
        return;
    }

    try {

        const res = await fetch("/auth/vendor-profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                storeName,
                businessRegNo,
                address,
                description
            })
        });

        const data = await res.json();

        alert(data.message);

    } catch (err) {
        console.error(err);
        alert("Failed to save store info");
    }
});