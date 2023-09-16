Model TodoItemModel {
    text = Take (
        String
    )
    completed = Let (
        Boolean
        false
    )
    complete = Control (
        Field { completed }
        enable
    )
}
