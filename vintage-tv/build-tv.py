import bpy
import math
import random
from pathlib import Path
from mathutils import Vector

output = Path(__file__).parent
if bpy.context.mode != 'OBJECT':
    bpy.ops.object.mode_set(mode='OBJECT')
if 'Analog_Wooden_TV' in bpy.data.collections:
    raise RuntimeError('Analog_Wooden_TV already exists; preserve the existing model.')
collection = bpy.data.collections.new('Analog_Wooden_TV')
bpy.context.scene.collection.children.link(collection)
original_selected = list(bpy.context.selected_objects)
original_active = bpy.context.view_layer.objects.active

def material(name, color, metallic=0, roughness=0.5):
    value = bpy.data.materials.new(name)
    value.use_nodes = True
    shader = value.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = roughness
    return value

wood = material('Analog_Walnut_Grain', (0.32, 0.15, 0.06), roughness=0.38)
image = bpy.data.images.new('Analog_Walnut_Texture', width=512, height=512)
pixels = []
random.seed(27)
for row in range(512):
    for column in range(512):
        bend = 5 * math.sin(row / 85) + 2 * math.sin(row / 31)
        grain = math.sin((column + bend) * 0.45)
        fine = math.sin((column + bend) * 2.3 + math.sin(row / 60))
        shade = 0.8 + 0.12 * grain + 0.05 * fine + random.random() * 0.05
        pixels.extend((0.46 * shade, 0.255 * shade, 0.125 * shade, 1))
image.pixels.foreach_set(pixels)
image.pack()
texture = wood.node_tree.nodes.new('ShaderNodeTexImage')
texture.image = image
wood.node_tree.links.new(texture.outputs['Color'], wood.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
charcoal = material('Analog_Charcoal', (0.025, 0.033, 0.032), roughness=0.6)
rubber = material('Analog_Speaker_Rubber', (0.045, 0.05, 0.046), roughness=0.85)
metal = material('Analog_Brushed_Aluminum', (0.52, 0.56, 0.53), metallic=0.85, roughness=0.26)
ivory = material('Analog_Ivory', (0.8, 0.79, 0.66), roughness=0.45)
red = material('Analog_Power_Red', (0.55, 0.055, 0.035), roughness=0.35)

def finish(obj, name, surface):
    obj.name = name
    for owner in list(obj.users_collection):
        owner.objects.unlink(obj)
    collection.objects.link(obj)
    obj.data.materials.append(surface)
    return obj

def box(name, location, dimensions, surface, bevel=0.04):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = finish(bpy.context.object, name, surface)
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new('Soft manufactured edges', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 4
        obj.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
    return obj

def cylinder(name, location, radius, depth, surface):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=radius, depth=depth, location=location, rotation=(math.pi / 2, 0, 0))
    obj = finish(bpy.context.object, name, surface)
    modifier = obj.modifiers.new('Rounded rim', 'BEVEL')
    modifier.width = 0.015
    modifier.segments = 3
    obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj

box('Cabinet_Walnut', (0, 0, 1.65), (4.2, 1.3, 2.7), wood, 0.14)
box('Front_Inset', (0, -0.666, 1.68), (3.98, 0.055, 2.43), charcoal, 0.1)
box('Screen_Trim', (-0.48, -0.715, 1.74), (2.88, 0.1, 2.18), metal, 0.12)
box('Screen_Bezel', (-0.48, -0.782, 1.74), (2.78, 0.1, 2.08), charcoal, 0.14)
box('Control_Panel', (1.44, -0.725, 1.67), (0.78, 0.085, 2.19), wood, 0.04)
for side in (-1, 1):
    box('Foot_' + str(side), (side * 1.48, 0, 0.19), (0.3, 0.83, 0.3), charcoal, 0.05)
    for depth in (-0.49, 0.49):
        cylinder('Cabinet_Screw', (side * 1.94, -0.7, 1.68 + depth * 2), 0.025, 0.025, metal)

for index, height in enumerate((1.48, 0.94)):
    cylinder('Speaker_Rim_' + str(index), (1.44, -0.82, height), 0.235, 0.08, metal)
    cylinder('Speaker_Cone_' + str(index), (1.44, -0.876, height), 0.206, 0.07, rubber)
    cylinder('Speaker_Cap_' + str(index), (1.44, -0.926, height), 0.085, 0.025, charcoal)
    for slot in range(5):
        box('Speaker_Grille', (1.44, -0.946, height + (slot - 2) * 0.07), (0.38, 0.018, 0.012), charcoal, 0.005)

for name, horizontal, height, radius, surface in (
    ('Button_Random', 1.44, 2.34, 0.215, metal),
    ('Button_Previous', 1.2, 1.91, 0.085, ivory),
    ('Button_Next', 1.67, 1.91, 0.085, ivory),
    ('Button_Power', 1.44, 0.57, 0.09, red),
):
    cylinder(name, (horizontal, -0.86, height), radius, 0.16, surface)
box('Dial_Marker', (1.44, -0.954, 2.45), (0.025, 0.018, 0.11), charcoal, 0.005)

for side in (-1, 1):
    pivot = bpy.data.objects.new('Antenna_' + ('Left' if side < 0 else 'Right'), None)
    collection.objects.link(pivot)
    pivot.location = (side * 0.24, 0, 3.02)
    start = Vector(pivot.location)
    end = start + Vector((side * 1.0, 0.06, 1.15))
    direction = end - start
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.022, depth=direction.length, location=(start + end) / 2)
    rod = finish(bpy.context.object, 'Antenna_Rod', metal)
    rod.rotation_mode = 'QUATERNION'
    rod.rotation_quaternion = direction.to_track_quat('Z', 'Y')
    rod.parent = pivot
    rod.matrix_parent_inverse = pivot.matrix_world.inverted()
box('Antenna_Base', (0, 0, 3.02), (0.8, 0.4, 0.12), charcoal, 0.06)
box('Rear_Cover', (0, 0.666, 1.66), (3.65, 0.08, 2.18), charcoal, 0.1)
for index in range(12):
    box('Rear_Vent', (-1.45 + index * 0.26, 0.714, 2.13), (0.10, 0.012, 0.47), rubber, 0.02)

bpy.ops.object.text_add(location=(1.12, -0.81, 2.66), rotation=(math.pi / 2, 0, 0))
label = bpy.context.object
label.data.body = 'analog.'
label.data.size = 0.16
label.data.extrude = 0.001
bpy.ops.object.convert(target='MESH')
finish(bpy.context.object, 'Brand_Analog', ivory)

bpy.ops.object.select_all(action='DESELECT')
for obj in collection.objects:
    obj.select_set(True)
bpy.context.view_layer.update()
bpy.ops.export_scene.gltf(filepath=str(output / 'wooden-tv.glb'), export_format='GLB', use_selection=True, export_apply=True, export_animations=False, export_yup=True)
bpy.data.libraries.write(str(output / 'wooden-tv.blend'), {collection}, fake_user=True)
bpy.ops.object.select_all(action='DESELECT')
for obj in original_selected:
    obj.select_set(True)
bpy.context.view_layer.objects.active = original_active
result = {'collection': collection.name, 'objects': len(collection.objects), 'glb_bytes': (output / 'wooden-tv.glb').stat().st_size, 'blend': str(output / 'wooden-tv.blend')}