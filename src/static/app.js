document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  async function unregisterParticipant(activityName, email) {
    const response = await fetch(
      `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
      { method: "DELETE" }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || "Failed to unregister");
    }

    return result;
  }

  function renderParticipantRow(activityName, email) {
    const row = document.createElement("div");
    row.className = "participant-row";

    const label = document.createElement("span");
    label.textContent = email;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "participant-remove";
    removeButton.setAttribute("aria-label", `Remove ${email} from ${activityName}`);
    removeButton.textContent = "×";

    removeButton.addEventListener("click", async () => {
      try {
        await unregisterParticipant(activityName, email);
        await fetchActivities();
      } catch (error) {
        messageDiv.textContent = error.message;
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }
    });

    row.appendChild(label);
    row.appendChild(removeButton);
    return row;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select an activity";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      activitySelect.appendChild(defaultOption);

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsTitle = document.createElement("p");
        participantsTitle.innerHTML = "<strong>Participants:</strong>";
        participantsSection.appendChild(participantsTitle);

        const participantsList = document.createElement("div");
        participantsList.className = "participants-list";

        if (details.participants.length === 0) {
          const empty = document.createElement("p");
          empty.className = "participants-empty";
          empty.textContent = "No participants yet.";
          participantsList.appendChild(empty);
        } else {
          details.participants.forEach((email) => {
            participantsList.appendChild(renderParticipantRow(name, email));
          });
        }

        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  fetchActivities();
});
