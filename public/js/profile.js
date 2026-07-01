document.addEventListener("DOMContentLoaded", () => {
    loadProfile();
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