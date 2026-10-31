"""Maps each public dataset's labels onto FieldGrid's 5 close-up classes.

A mapping value of None drops that label. `caps` limits images per target class
per source so no single dataset dominates. `domain` records how the photo was
taken, so test results can be reported separately for drone imagery.
"""

CLASSES = ["healthy", "weed", "disease", "insect_damage", "other"]

DISEASE_WORDS = ("spot", "blight", "rust", "scab", "mildew", "mold", "virus", "rot")


def _plantdoc(name: str):
    n = name.lower()
    if "mites" in n:
        return "insect_damage"
    if any(w in n for w in DISEASE_WORDS):
        return "disease"
    return "healthy"


SOURCES = {
    # --- weeds ---
    "Project-AgML/soybean_weed_uav_brazil": {
        "license": "cc-by-nc-3.0", "domain": "uav",
        "map": {"broadleaf": "weed", "grass": "weed", "soybean": "healthy", "soil": "other"},
        "caps": {"weed": 3000, "healthy": 2000, "other": 800},
    },
    "Project-AgML/sorghum_weed_classification": {
        "license": "cc-by-4.0", "domain": "ground",
        "map": {"BroadLeafWeed": "weed", "Grass": "weed", "Sorghum": "healthy"},
        "caps": {"weed": 1500, "healthy": 800},
    },
    "Project-AgML/DeepWeeds_classification": {
        "license": "cc-by-4.0", "domain": "ground",
        # classes 0-7 are weed species; 8 is rangeland background with no weed
        "map": {str(i): "weed" for i in range(8)} | {"8": None},
        "caps": {"weed": 1500},
    },
    "Project-AgML/MH_Weed16_weed_variety_classification": {
        "license": "cc-by-4.0", "domain": "ground",
        "map": "all:weed",
        "caps": {"weed": 1500},
    },
    # --- disease, insects, healthy (soybean first) ---
    "Project-AgML/MH_SoyaHealthVision_disease_classification_uav": {
        "license": "cc-by-4.0", "domain": "uav",
        "map": {"Healthy": "healthy", "Mosaic": "disease", "Rust": "disease",
                "Semilooper_Pest": "insect_damage"},
        "caps": {},
    },
    "Project-AgML/MH_SoyaHealthVision_disease_classification_leaf": {
        "license": "cc-by-4.0", "domain": "leaf",
        "map": {"Caterpillar_Semilooper_Pest": "insect_damage", "Frog_Leaf_Eye": "disease",
                "Healthy": "healthy", "Mosaic": "disease", "Rust": "disease",
                "Spectoria_Brown_Spot": "disease"},
        "caps": {},
    },
    "Project-AgML/soybean_leaf_disease_classification": {
        "license": "cc-by-4.0", "domain": "leaf",
        "map": {"Bacterial leaf Blight": "disease", "Septoria_Brown_Spot": "disease",
                "Vein Necrosis": "disease", "Healthy": "healthy", "Dry_leaf": "other",
                "Root_images": None},
        "caps": {},
    },
    "Project-AgML/soybean_insect_classification": {
        "license": "cc-by-4.0", "domain": "leaf",
        "map": {"Caterpillar": "insect_damage", "Diabrotica_speciosa": "insect_damage",
                "Healthy": "healthy"},
        "caps": {"healthy": 1500},
    },
    "Project-AgML/soybean_leaf_wilt_classification_2": {
        "license": "cc-by-4.0", "domain": "ground",
        # wilt severity 0-5; 0 = no wilt, 3-5 = clear wilting; 1-2 too ambiguous to label
        "map": {"0": "healthy", "1": None, "2": None, "3": "other", "4": "other", "5": "other"},
        "caps": {},
    },
    "Project-AgML/corn_maize_leaf_disease": {
        "license": "unknown (research only until confirmed)", "domain": "leaf",
        "map": {"Blight": "disease", "Common_Rust": "disease", "Gray_Leaf_Spot": "disease",
                "Healthy": "healthy"},
        "caps": {"disease": 2000, "healthy": 1000},
    },
    "Project-AgML/cotton_leaf_disease_classification": {
        "license": "cc-by-nc-4.0", "domain": "leaf",
        "map": {"Alternaria_Leaf": "disease", "Bacterial_Blight": "disease",
                "Fusarium_Wilt": "disease", "Verticillium_Wilt": "disease",
                "Healthy_Leaf": "healthy"},
        "caps": {"disease": 1500, "healthy": 800},
    },
    "Project-AgML/plant_doc_classification": {
        "license": "cc-by-sa-4.0", "domain": "field",
        "map": "fn:plantdoc",
        "caps": {},
    },
}


def target_class(source_id: str, label_name: str):
    """Return the FieldGrid class for a source label, or None to drop it."""
    m = SOURCES[source_id]["map"]
    if m == "all:weed":
        return "weed"
    if m == "fn:plantdoc":
        return _plantdoc(label_name)
    return m.get(label_name)


def slug(source_id: str) -> str:
    return source_id.split("/")[-1]
