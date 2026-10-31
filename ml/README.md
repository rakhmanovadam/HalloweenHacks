# FieldGrid close-up classifier

Image model for the drone scouting pipeline. After NDVI flags an unhealthy grid cell, the drone takes close-up photos and this model labels each photo tile as one of:

| Class | Meaning | Spray candidate? |
| --- | --- | --- |
| `healthy` | Crop looks normal | No |
| `weed` | A weed is visible | Yes, herbicide (if above threshold) |
| `disease` | Spots, lesions, rust, blight, mosaic | Maybe, fungicide only works on fungal disease |
| `insect_damage` | Chewing, holes, missing leaf area | Yes, insecticide (if above threshold) |
| `other` | Wilting, dry leaves, bare soil, anything else | No, send to a person |

## Model

- ConvNeXt-Tiny (`convnext_tiny.fb_in22k_ft_in1k`, open weights via timm), fine-tuned for 6 epochs at 224 px.
- Trained on a Modal A10G GPU in about 2.5 minutes.
- Weights: `models/fieldgrid_closeup_convnext_tiny_fp16.pt` (half precision, 56 MB).

## Results (run 20261031-180527)

Test set: 1,154 images the model never trained on.

| Class | Precision | Recall |
| --- | --- | --- |
| healthy | 0.971 | 0.988 |
| weed | 0.996 | 0.996 |
| disease | 0.972 | 0.980 |
| insect_damage | 0.976 | 0.953 |
| other | 0.994 | 0.994 |

Overall accuracy 98.1%; drone images 99.7%; single-leaf images 96.3%. Full report in `results/report.txt`, per-image predictions in `results/test_predictions.csv`, example training images in `results/samples.png`.

**These numbers are optimistic.** The split was 80/10/10 per image, so test images come from the same datasets (often the same field or plant) as training images. Expect lower accuracy on new farms until the model is evaluated with a held-out-dataset split and fine-tuned on our own drone flights.

## Data

12 public datasets from [Project AgML on Hugging Face](https://huggingface.co/Project-AgML), relabeled into the 5 classes (mapping in `label_map.py`). Training used up to 2,500 images per class.

| Dataset | Photo type | Used for | License |
| --- | --- | --- | --- |
| soybean_weed_uav_brazil | Drone | weed, healthy, other (soil) | CC BY-NC 3.0 |
| MH_SoyaHealthVision (UAV) | Drone | healthy, disease, insect damage | CC BY 4.0 |
| MH_SoyaHealthVision (leaf) | Leaf | disease, insect damage, healthy | CC BY 4.0 |
| soybean_insect_classification | Leaf | insect damage, healthy | CC BY 4.0 |
| soybean_leaf_disease_classification | Leaf | disease, healthy, other | CC BY 4.0 |
| soybean_leaf_wilt_classification_2 | Ground | healthy, other (wilting) | CC BY 4.0 |
| sorghum_weed_classification | Ground | weed, healthy | CC BY 4.0 |
| DeepWeeds_classification | Ground | weed | CC BY 4.0 |
| MH_Weed16_weed_variety_classification | Ground | weed | CC BY 4.0 |
| corn_maize_leaf_disease | Leaf | disease, healthy | Unknown |
| cotton_leaf_disease_classification | Leaf | disease, healthy | CC BY-NC 4.0 |
| plant_doc_classification | Field | disease, healthy | CC BY-SA 4.0 |

Some sources are non-commercial or unlicensed, so these weights are for research and demos. A commercial model should retrain on permissively licensed and our own data.

## Use the model

```bash
pip install -r requirements.txt
python predict.py photo1.jpg photo2.jpg
python predict.py --dir path/to/images
```

Output: predicted class, confidence and all class probabilities. Treat confidence below 0.65 as "not sure" and route to a person.

## Retrain on Modal

```bash
modal run modal_app.py --step prep      # download and relabel datasets into the Modal volume
modal run modal_app.py --step samples   # write results/samples.png
modal run modal_app.py --step train     # fine-tune on an A10G and print the test report
```

## Next steps

- Held-out-dataset evaluation (grouped 5-fold cross-validation by dataset).
- Fine-tune on partner-farm drone flights with scout-confirmed labels.
- Segmentation model to mark exact weed pixels for spot spraying.
